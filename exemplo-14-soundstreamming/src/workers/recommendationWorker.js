/**
 * recommendationWorker.js — Worker de recomendação de músicas (SoundStreaming)
 * Mesmo padrão do e-commerce: contexto (tracks + users), encode track/user,
 * treino (rede binária "ouviu ou não"), recommend ordena por score.
 * Usuário novo sem listenedTracks: encodeUser usa só idade (perfil) → modelo sugere por perfil.
 */

import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _globalCtx = {};
let _model = null;

const WEIGHTS = { genre: 0.5, duration: 0.2, age: 0.3 };
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(tracks, users) {
  const ages = users.map((u) => u.age);
  const durations = tracks.map((t) => t.durationMs || 0);
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const genres = [...new Set(tracks.map((t) => t.genre))];
  const genreIndex = Object.fromEntries(genres.map((g, i) => [g, i]));

  const midAge = (minAge + maxAge) / 2;
  const ageSums = {};
  const ageCounts = {};
  users.forEach((user) => {
    (user.listenedTracks || []).forEach((t) => {
      ageSums[t.name] = (ageSums[t.name] || 0) + user.age;
      ageCounts[t.name] = (ageCounts[t.name] || 0) + 1;
    });
  });
  const trackAvgAgeNorm = Object.fromEntries(
    tracks.map((track) => {
      const avg = ageCounts[track.name] ? ageSums[track.name] / ageCounts[track.name] : midAge;
      return [track.name, normalize(avg, minAge, maxAge)];
    })
  );

  return {
    tracks,
    users,
    genreIndex,
    trackAvgAgeNorm,
    minAge,
    maxAge,
    minDur,
    maxDur,
    numGenres: genres.length,
    dimensions: 1 + 1 + genres.length, // duration, ageNorm, genre one-hot
  };
}

const oneHotWeighted = (index, length, weight) =>
  tf.oneHot(index, length).cast('float32').mul(weight);

function encodeTrack(track, context) {
  const duration = tf.tensor1d([
    normalize(track.durationMs || 0, context.minDur, context.maxDur) * WEIGHTS.duration,
  ]);
  const ageNorm = tf.tensor1d([
    (context.trackAvgAgeNorm[track.name] ?? 0.5) * WEIGHTS.age,
  ]);
  const genre = oneHotWeighted(
    context.genreIndex[track.genre] ?? 0,
    context.numGenres,
    WEIGHTS.genre
  );
  return tf.concat1d([duration, ageNorm, genre]);
}

function encodeUser(user, context) {
  const list = user.listenedTracks || [];
  if (list.length > 0) {
    return tf
      .stack(list.map((t) => encodeTrack(t, context)))
      .mean(0)
      .reshape([1, context.dimensions]);
  }
  return tf
    .concat1d([
      tf.zeros([1]),
      tf.tensor1d([normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age]),
      tf.zeros([context.numGenres]),
    ])
    .reshape([1, context.dimensions]);
}

function createTrainingData(context) {
  const inputs = [];
  const labels = [];
  context.users
    .filter((u) => (u.listenedTracks || []).length > 0)
    .forEach((user) => {
      const userVec = encodeUser(user, context).dataSync();
      context.tracks.forEach((track) => {
        const trackVec = encodeTrack(track, context).dataSync();
        const label = (user.listenedTracks || []).some((t) => t.name === track.name) ? 1 : 0;
        inputs.push([...userVec, ...trackVec]);
        labels.push(label);
      });
    });
  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimension: context.dimensions * 2,
  };
}

async function configureAndTrain(trainData) {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimension],
      units: 128,
      activation: 'relu',
    })
  );
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });
  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        postMessage({
          type: workerEvents.trainingLog,
          epoch,
          loss: logs.loss,
          accuracy: logs.acc ?? logs.accuracy,
        });
      },
    },
  });
  return model;
}

async function trainModel({ users }) {
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
  const tracks = await (await fetch('/data/tracks.json')).json();
  const context = makeContext(tracks, users);
  context.trackVectors = tracks.map((track) => ({
    name: track.name,
    meta: { ...track },
    vector: encodeTrack(track, context).dataSync(),
  }));
  _globalCtx = context;
  const trainData = createTrainingData(context);
  _model = await configureAndTrain(trainData);
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
  postMessage({ type: workerEvents.trainingComplete });
}

function recommend({ user }) {
  if (!_model) return;
  const context = _globalCtx;
  const userVector = encodeUser(user, context).dataSync();
  const inputs = context.trackVectors.map(({ vector }) => [...userVector, ...vector]);
  const inputTensor = tf.tensor2d(inputs);
  const predictions = _model.predict(inputTensor);
  const scores = predictions.dataSync();
  const recommendations = context.trackVectors.map((item, i) => ({
    ...item.meta,
    name: item.name,
    score: scores[i],
  }));
  const sorted = recommendations.sort((a, b) => b.score - a.score);
  postMessage({ type: workerEvents.recommend, user, recommendations: sorted });
}

const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
};

self.onmessage = (e) => {
  const { action, ...data } = e.data || {};
  if (handlers[action]) handlers[action](data);
};

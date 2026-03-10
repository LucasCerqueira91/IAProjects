/**
 * =============================================================================
 * modelTrainingWorker.js — Web Worker: treino e predição com TensorFlow.js
 * =============================================================================
 *
 * Toda a lógica de ML roda aqui, em thread separada, para não travar a UI.
 * Em C#: análogo a rodar o treino em Task.Run(() => { ... }) e comunicar
 * resultados por Channel ou eventos.
 *
 * Conceitos de IA aplicados:
 * - Normalização de features (0–1) para balancear influência no treino.
 * - One-hot encoding para categorias (cor, categoria).
 * - Rede neural sequencial (entrada → densas → saída sigmoid) para
 *   classificação binária "usuário compraria este produto?".
 * - Loss: binaryCrossentropy; otimizador: Adam.
 */

import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

// -----------------------------------------------------------------------------
// Normalização: coloca valores contínuos (preço, idade) no intervalo [0, 1].
// Evita que uma feature com escala grande (ex.: preço 10–1000) domine o treino.
// Em ML é padrão; em C# seria: (value - min) / (max - min) com cuidado para
// divisão por zero (max - min == 0).
// -----------------------------------------------------------------------------
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

/**
 * Monta o "contexto" de treino: intervalos min/max, índices de cores/categorias,
 * média de idade por produto (para personalização). Esse objeto é usado tanto
 * no treino quanto na predição para codificar usuários e produtos de forma
 * consistente.
 */
function makeContext(products, users) {
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Índices para one-hot: cada cor/categoria vira um número (0, 1, 2, ...).
    // Em C#: análogo a Dictionary<string, int> para enumeração.
    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];
    const colorsIndex = Object.fromEntries(
        colors.map((color, index) => [color, index])
    );
    const categoriesIndex = Object.fromEntries(
        categories.map((category, index) => [category, index])
    );

    // Média de idade dos compradores por produto — usada como feature do produto
    // para o modelo aprender que certos itens são mais comprados por faixas etárias.
    // (ajuda a personalizar)
    const midAge = (minAge + maxAge) / 2
    const ageSums = {}
    const ageCounts = {}

    users.forEach(user => {
        user.purchases.forEach(p => {
            ageSums[p.name] = (ageSums[p.name] || 0) + user.age
            ageCounts[p.name] = (ageCounts[p.name] || 0) + 1
        })
    })

    const productAvgAgeNorm = Object.fromEntries(
        products.map(product => {
            const avg = ageCounts[product.name] ?
                ageSums[product.name] / ageCounts[product.name] :
                midAge

            return [product.name, normalize(avg, minAge, maxAge)]
        })
    )

    return {
        products,
        users,
        colorsIndex,
        categoriesIndex,
        productAvgAgeNorm,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        // price + age + colors + categories
        dimentions: 2 + categories.length + colors.length
    }
}


/**
 * Treino (esqueleto nesta parte do exercício): carrega produtos, monta contexto,
 * envia progresso e "complete". Na parte05 este worker implementa o treino
 * completo: createTrainingData, configureNeuralNetAndTrain, e recommend.
 */
async function trainModel({ users }) {
    console.log('Training model with users:', users);
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
    const products = await (await fetch('/data/products.json')).json();
    const context = makeContext(products, users);
    debugger; // Ponto de parada para inspecionar context no DevTools.
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

/**
 * Recomendação (esqueleto): na parte05 aqui é feita encodeUser, concatenação
 * com vetores de produtos, model.predict() e postMessage com lista ordenada.
 */
function recommend({ user }) {
    // postMessage({ type: workerEvents.recommend, user, recommendations: sortedItems });
}

// Roteamento de mensagens: o worker recebe { action, ...data } e chama
// o handler correspondente. Em C#: padrão Command/Dispatcher por tipo de mensagem.
const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend,
};

self.onmessage = (e) => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};

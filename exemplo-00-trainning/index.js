import tf from '@tensorflow/tfjs-node';

async function trainModel(inputXs, outputYs) {
    const model = tf.sequential()

    model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: 'relu' }))

    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))

        model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    })


     await model.fit(
        inputXs,
        outputYs,
        {
            verbose: 0,
            epochs: 100,
            shuffle: true,
            callbacks: {
                // onEpochEnd: (epoch, log) => console.log(
                //     `Epoch: ${epoch}: loss = ${log.loss}`
                // )
            }
        }
    )

    return model
}


async function predict(model, pessoa) {
    // transformar o array js para o tensor (tfjs)
    const tfInput = tf.tensor2d(pessoa)

    // Faz a predição (output será um vetor de 3 probabilidades)
    const pred = model.predict(tfInput)
    const predArray = await pred.array()
    return predArray[0].map((prob, index) => ({ prob, index }))
}



const tensorNormalizedPeople = [
    [0.33, 1, 0, 0, 1, 0, 0], // Erick
    [0, 0, 1, 0, 0, 1, 0],    // Ana
    [1, 0, 0, 1, 0, 0, 1]     // Carlos
]


const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Erick
    [0, 1, 0], // medium - Ana
    [0, 0, 1]  // basic - Carlos
];


const inputXs = tf.tensor2d(tensorNormalizedPeople)
const outputYs = tf.tensor2d(tensorLabels)


const model = await trainModel(inputXs, outputYs)

const person = { nome: 'zé', idade: 28, cor: 'verde', localizacao: "Curitiba" }

const personTensorNormalized = [
    [
        0.2, // idade normalizada
        1,    // cor azul
        0,    // cor vermelho
        0,    // cor verde
        0,    // localização São Paulo
        1,    // localização Rio
        0     // localização Curitiba
    ]
]

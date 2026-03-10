import tf from '@tensorflow/tfjs-node';

const tensorNormalizedPeople = [
    [0.33, 1, 0, 0, 1, 0, 0], // Erick
    [0, 0, 1, 0, 0, 1, 0],    // Ana
    [1, 0, 0, 1, 0, 0, 1]     // Carlos
]

const labelsNames = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Erick
    [0, 1, 0], // medium - Ana
    [0, 0, 1]  // basic - Carlos
];

const inputXs = tf.tensor2d(tensorNormalizedPeople)
const outputYs = tf.tensor2d(tensorLabels)

inputXs.print();
outputYs.print();

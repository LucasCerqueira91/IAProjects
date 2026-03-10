/**
 * Constantes de eventos: nomes usados no document (CustomEvent) e nas
 * mensagens do worker. Centralizar evita strings mágicas e facilita refatoração.
 * Em C#: análogo a constantes estáticas ou enum para tipos de mensagem.
 */

export const events = {
    userSelected: 'user:selected',
    usersUpdated: 'users:updated',
    purchaseAdded: 'purchase:added',
    purchaseRemoved: 'purchase:remove',
    modelTrain: 'training:train',
    trainingComplete: 'training:complete',
    modelProgressUpdate: 'model:progress-update',
    recommendationsReady: 'recommendations:ready',
    recommend: 'recommend',
};

export const workerEvents = {
    trainingComplete: 'training:complete',
    trainModel: 'train:model',
    recommend: 'recommend',
    trainingLog: 'training:log',
    progressUpdate: 'progress:update',
    tfVisData: 'tfvis:data',
    tfVisLogs: 'tfvis:logs',
};
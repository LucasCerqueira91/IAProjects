/**
 * =============================================================================
 * WorkerController — Ponte entre a UI e o Web Worker de ML
 * =============================================================================
 *
 * Responsabilidade: enviar comandos ao worker (treinar, recomendar) e
 * traduzir mensagens do worker em eventos do documento (CustomEvent),
 * para que as views atualizem sem conhecer o worker.
 *
 * Conceito de IA: o controller não contém lógica de rede neural; apenas
 * orquestra. O modelo é treinado e usado dentro do worker.
 *
 * Em C#: análogo a um serviço que envia mensagens para um BackgroundWorker
 * ou Task em outra thread e expõe eventos (event EventHandler TrainingComplete)
 * quando recebe resultados.
 */

import { workerEvents } from "../events/constants.js";

export class WorkerController {
    // Campos privados (sintaxe #) — Em C#: private readonly IWorker _worker;
    #worker;
    #events;
    #alreadyTrained = false;

    constructor({ worker, events }) {
        this.#worker = worker;
        this.#events = events;
        this.#alreadyTrained = false;
        this.init();
    }

    async init() {
        this.setupCallbacks();
    }

    /**
     * Factory estático: cria a instância e retorna (padrão comum em JS).
     * Em C#: public static WorkerController Create(Deps deps) => new WorkerController(deps);
     */
    static init(deps) {
        return new WorkerController(deps);
    }

    /**
     * Registra todos os callbacks: (1) reação a eventos da UI (train, recommend)
     * e (2) handler de mensagens do worker (progress, complete, tfvis, recommend).
     */
    setupCallbacks() {
        // Quando a UI pede treino (ex.: botão "Treinar"), envia comando ao worker
        // e marca que o modelo ainda não está pronto para recomendar.
        this.#events.onTrainModel((data) => {
            this.#alreadyTrained = false;
            this.triggerTrain(data);
        });

        // Worker enviou "training complete" — modelo pronto para predição.
        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
        });

        // Quando a UI pede recomendação (ex.: usuário selecionado), só envia
        // ao worker se o modelo já foi treinado; evita predição com modelo nulo.
        this.#events.onRecommend((data) => {
            if (!this.#alreadyTrained) return;
            this.triggerRecommend(data);
        });

        // Tipos de mensagem que não queremos logar no console (evita poluição).
        const eventsToIgnoreLogs = [
            workerEvents.progressUpdate,
            workerEvents.trainingLog,
            workerEvents.tfVisData,
            workerEvents.tfVisLogs,
            workerEvents.trainingComplete,
        ];

        // Handler único de mensagens do worker. Equivalente em C# a um
        // callback/evento que recebe um objeto com .Type e .Payload.
        this.#worker.onmessage = (event) => {
            if (!eventsToIgnoreLogs.includes(event.data.type))
                console.log(event.data);

            if (event.data.type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(event.data.progress);
            }

            if (event.data.type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete(event.data);
            }

            // Dados para o painel tfvis (gráficos de loss/accuracy no treino).
            if (event.data.type === workerEvents.tfVisData) {
                this.#events.dispatchTFVisorData(event.data.data);
            }

            if (event.data.type === workerEvents.trainingLog) {
                this.#events.dispatchTFVisLogs(event.data);
            }

            if (event.data.type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(event.data);
            }
        };
    }

    /** Envia comando de treino ao worker com a lista de usuários. */
    triggerTrain(users) {
        this.#worker.postMessage({ action: workerEvents.trainModel, users });
    }

    /** Envia comando de recomendação ao worker para o usuário dado. */
    triggerRecommend(user) {
        this.#worker.postMessage({ action: workerEvents.recommend, user });
    }
}
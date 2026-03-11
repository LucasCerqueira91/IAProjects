import { View } from './View.js';

export class TFVisorView extends View {
  constructor() {
    super();
    if (typeof tfvis !== 'undefined') tfvis.visor().open();
  }

  handleTrainingLog(log) {
    if (typeof tfvis === 'undefined') return;
    const { epoch, loss, accuracy } = log;
    const lossPoints = [{ x: epoch, y: loss }];
    const accPoints = [{ x: epoch, y: accuracy }];
    tfvis.render.linechart(
      { name: 'Model Accuracy', tab: 'Training', style: { display: 'inline-block', width: '49%' } },
      { values: accPoints, series: ['accuracy'] },
      { xLabel: 'Epoch', yLabel: 'Accuracy', height: 300 }
    );
    tfvis.render.linechart(
      { name: 'Training Loss', tab: 'Training', style: { display: 'inline-block', width: '49%' } },
      { values: lossPoints, series: ['loss'] },
      { xLabel: 'Epoch', yLabel: 'Loss', height: 300 }
    );
  }
}

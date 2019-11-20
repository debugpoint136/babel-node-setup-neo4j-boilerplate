import * as d3 from 'd3';
import Papa from 'papaparse';
// import * as BABYLON from 'babylonjs';
const URL = 'https://raw.githubusercontent.com/debugpoint136/chromosome-3d/master/IMR90_chr07-0-159Mb.csv';

/**
 * 
 * @param {Object} dataReceived 
 * @param {Array} csvData 
 */
const filterForCoordinates = function(dataReceived, csvData) {
  // createGenomicToSpatialMap(dataReceived, csvData);
  // assigns flag, arc, and viewRegion data to separate variables
  let viewRegion = JSON.parse(dataReceived.viewRegion);
  let interaction = JSON.parse(dataReceived.interaction);
  let signal = JSON.parse(dataReceived.signal);
  if (csvData) {
    const adjustedStart = calcScaledPosition(viewRegion.start, 158800000, csvData.length); // TODO: remove hard-coding
    const adjustedStop = calcScaledPosition(viewRegion.stop, 158800000, csvData.length);  // TODO: remove hard-coding

    // NEXT :  using these, slice out that region from csvData
    console.log(csvData.slice(0, 10).map(item => {
      const { X, Y, Z } = item;
      let x = parseInt(X);
      let y = parseInt(Y);
      let z = parseInt(Z);
      return new BABYLON.Vector3(x, y, z);
    }));
    let relevantCsvData = csvData.slice(adjustedStart, adjustedStop);

    return {
      adjustedStart,
      adjustedStop,
      interaction,
      signal,
      relevantCsvData,
      viewRegion
    }
  }
}

export { filterForCoordinates }

/**
 * 
 * @param {*} position 
 * @param {*} scalingRatio 
 * @param {*} arrLength 
 */
const calcScaledPosition = function(position, scalingRatio, arrLength) {
  let positionNumber = parseInt(position);
  let scalingRatioNumber = parseInt(scalingRatio);
  let arrLengthNumber = parseInt(arrLength);

  if (positionNumber !== NaN && scalingRatioNumber !== NaN && arrLengthNumber !== NaN) {
    return ( positionNumber / scalingRatioNumber ) * arrLengthNumber;
  } else {
    throw new Error('Not a valid number passed to calcScaledPosition function');
  }
}


export async function getCSVdataUsingD3() {
  const dataFromLocalFile = await d3.csv('../data/IMR90_chr07-0-159Mb.csv');
  const strToNum = dataFromLocalFile.slice(0, 100).map(item => {
      let tmp = {};
      Object.keys(item).forEach(key => {
          let value = item[key];
          tmp[key] = parseFloat(value); 
      })
      return tmp;
  });
  return { data: strToNum }
}

export async function getCSVData() {
  const res = await fetch(URL);
  const text = await res.text();

  if (res.ok) {
      const splitData = text.split('\n');
      const content = splitData.slice(1, splitData.length - 1); // first line is Description

      let parsedCSVData = Papa.parse(content.join('\r\n'), {
                  dynamicTyping: true,
                  header: true
              });

      return parsedCSVData;
  } else {
      throw new Error(text);
  }
}

export function createGenomicToSpatialMap(genomicCoordinates, spatialCoordinates) {
  // Domain —> Range
  // Make 10 Deciles
  let viewRegion = JSON.parse(genomicCoordinates.viewRegion);
  let interaction = JSON.parse(genomicCoordinates.interaction);
  let signal = JSON.parse(genomicCoordinates.signal);

  console.log(signal[0]);
  console.log(signal[signal.length - 1]);

  console.log(viewRegion);

  console.log(spatialCoordinates[0]);
  console.log(spatialCoordinates[spatialCoordinates.length - 1]);
  // const genomicSubset = genomicCoordinates.slice(0, 100);
  // const spatialSubset = spatialCoordinates.slice(0, 60);

  
}
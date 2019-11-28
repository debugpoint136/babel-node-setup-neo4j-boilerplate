import neo4j from "neo4j-driver/lib/browser/neo4j-web";
import { getCSVData } from './helper';
import 'dotenv/config';
const GENOME_TO_SPACE_SCALE = 620;
const MAX_RECORDS_PER_SESSION = 10000;
// const attempt = require("@assertchris/attempt-promise");
// const firebase_example_data = require('../data/example.firebase.json');
// const firebase_example_data = require('../data/genes.json');
import { data } from '../data/sample.submission';
import { linkSync } from "fs";

export default class Neo4jDataImporter {
  constructor() {
    this.driver = neo4j.driver(
      process.env.REACT_APP_NEO4J_URI,
      neo4j.auth.basic(
        process.env.REACT_APP_NEO4J_USER,
        process.env.REACT_APP_NEO4J_PASSWORD
      ),
      { encrypted: false }
    );
  }

  submitAnnotations = async (list) => {
    // if the list is too big, chunk it
    if (list.length === 0) {
      list = data;
    }

    const coordinatesOnly = extractCoordinates(list);
    // console.log(coordinatesOnly);
    //TODO: add filter by chr
    const query_fetch_coordinates = `WITH {data} as data
      UNWIND data.rows as q
      MATCH (sp:SpacePoint) 
      WHERE sp.start > q.checkpoint - ${GENOME_TO_SPACE_SCALE / 2}
      AND sp.start < q.checkpoint + ${GENOME_TO_SPACE_SCALE / 2} 
      RETURN sp.coordinate as coordinate, q.checkpoint as query
      `;
    // console.log(query_fetch_coordinates);
    const res = await this.neo4JRequest(query_fetch_coordinates, coordinatesOnly);
    let coordinatesLookup = {};
    for (const elem of res.records) {
      let { x, y, z} = elem._fields[0];
      coordinatesLookup[elem._fields[1]] = {x, y, z};
    }
    const updatedList = updateListWithCoordinates(list, coordinatesLookup)
    const submitQuery = createNeo4jSubmitQuery(updatedList)
    console.log(submitQuery);
    console.log(updatedList)
    const submitResponse = await this.neo4JRequest(submitQuery, updatedList);
    console.log(submitResponse);
      // regardless of type it needs to fetch coordinates from neo4j - 
        // one function to extract just the coordinates ✔
        // add 620, minus 620 ✔
        // neo4j call ✔
      // using coordinates, consolidate , update and format in required format ✔

      // deposit back to neo4j with coordinates

  }

  start = async () => {
    // read the CSV file, take 100 rows   ✔
    // extract and format rows
    // call neo4j function to submit to db
    const csvFileResponse = await getCSVData();// url 
    const { data } = csvFileResponse;
    /*
    const formattedData = data.map(({X, Y, Z}, index) => {
      let { start, end } = calcLocus(index);
      return {  
                coordinate: {
                  x: Math.round(X), 
                  y: Math.round(Y), 
                  z: Math.round(Z)
                },
                genomicLocus: 
                  { chr: 7, 
                    assembly: 'hg38', 
                    start, 
                    end 
                  } 
              }
    }); 

    const sessionsRequired = Math.ceil(formattedData.length / MAX_RECORDS_PER_SESSION);
    let dataSlice = [];
    const query = `WITH {data} as data
    UNWIND data.rows as q    
    CREATE (sp: SpacePoint { coordinate: point({ x: q.coordinate.x, y: q.coordinate.y, z: q.coordinate.z }), chr: q.genomicLocus.chr, assembly: q.genomicLocus.assembly, start: q.genomicLocus.start, end: q.genomicLocus.end })
    RETURN sp
      `;
    for (let index = 0; index < sessionsRequired; index++) {
      dataSlice = formattedData.slice(index * MAX_RECORDS_PER_SESSION , index * MAX_RECORDS_PER_SESSION + MAX_RECORDS_PER_SESSION);
      
      try {
        console.log(`completing request ${index+1}`);
        // const res = await this.neo4JRequest(query, dataSlice)

      } catch (error) {
        console.log(error);
      }
      
    }
    */ 
  }

  

  neo4JRequest = async (query, params) => {

    if (!query) {
      throw Error('No query provided');
    }
    const session = this.driver.session();
    try {
      const results = await session.run(query, {
        data: { rows: params }
      });
      session.close();
      return results;
    } catch (error) {
      session.close();
    }
  };
}

function calcLocus(input) {
  let start = input * GENOME_TO_SPACE_SCALE;
  let end = start + GENOME_TO_SPACE_SCALE;

  return { start, end };
}

function extractCoordinates(list) {
  let tmp = [];
  list.forEach(d => {
    const { start, end, chr } = d.locus; // TODO: extract links as well
    // tmp.push({ locusEntry: start, ...getBoundaryCoordinates(start) });
    // tmp.push({ locusEntry: end, ...getBoundaryCoordinates(end) });
    tmp.push({ checkpoint: start });
    tmp.push({ checkpoint: end });
  })

  return tmp;
}

function updateListWithCoordinates(list, coordinatesLookup) {
  let results = [];
  list.forEach(d => {
    let { start, end } = d.locus;
    const coordinate_start = coordinatesLookup[start] || undefined;
    const coordinate_end = coordinatesLookup[end] || undefined;

    const res = Object.assign({ coordinate_start, coordinate_end }, {...d});
    if (res.hasOwnProperty('metadata')) {
      res.metadata = JSON.stringify(res.metadata);
    }
    results.push(res);
  })

  return results;
}


function createNeo4jSubmitQuery(list) {
  // create one Point node at startCoordinate
  // create one Point node at endCoordinate
  // Create relationship between 2 nodes
  // attach all attributes
  let query = ``;
  let { links } = list;
  // if (links.length > 0) {

  // } else {
    let queryPart = `WITH {data} as data
    UNWIND data.rows as q
    MERGE (ap: AnnotationPoint 
      { 
        coordinate: point({ x: q.coordinate_start.x, y: q.coordinate_start.y, z: q.coordinate_start.z }), 
        chr: q.locus.chr, genomic_locus_start: q.locus.start, genomic_locus_end: q.locus.end,
        value: q.value, value_type: q.value_type, metadata: q.metadata,
        scope: q.scope, type: q.type, name: q.name
      }
    )
    RETURN ap`;
  // }

  return query + queryPart;
  
}
import neo4j from "neo4j-driver/lib/browser/neo4j-web";
import { getCSVData } from './helper';
import 'dotenv/config';

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

  start = async () => {
    // read the CSV file, take 100 rows   ✔
    // extract and format rows
    // call neo4j function to submit to db
    const csvFileResponse = await getCSVData();// url 
    const { data } = csvFileResponse;
    const formattedData = data.map(({X, Y, Z}) => ({ x: Math.round(X), y: Math.round(Y), z: Math.round(Z) })); 
    const done = await this.submitToNeo4j(formattedData);
  }

  submitToNeo4j = async (input) => {
    const session = this.driver.session();

    let query;

    query = `WITH {data} as data
    UNWIND data.rows as q    
    CREATE (sp: SpacePoint { coordinate: point({ x: q.x, y: q.y, z: q.z }) })
    RETURN sp
      `;

    session
      .run(query, {
        data: { rows: input }
      })
      .then(result => {
        console.log(result);
        session.close();
      })
      .catch(e => {
        // TODO: handle errors.
        console.log(e);
        session.close();
      });
  };
  

  fetchBusinesses = () => {
    const session = this.driver.session();

    let query;

      query = `MATCH (r:OSMRelation) USING INDEX r:OSMRelation(relation_osm_id)
        WHERE r.relation_osm_id=$regionId AND exists(r.polygon)
      WITH r.polygon as polygon
      MATCH (p:PointOfInterest)
        WHERE distance(p.location, point({latitude: $lat, longitude:$lon})) < ($radius * 1000)
        AND amanzi.withinPolygon(p.location,polygon)
      RETURN p
      `;

    session
      .run(query, {
        lat: mapCenter.latitude,
        lon: mapCenter.longitude,
        radius: mapCenter.radius,
        regionId: this.state.regionId
      })
      .then(result => {
        console.log(result);
        const pois = result.records.map(r => r.get("p"));
        this.setState({ pois });
        session.close();
      })
      .catch(e => {
        // TODO: handle errors.
        console.log(e);
        session.close();
      });
  };
}
import neo4j from "neo4j-driver/lib/browser/neo4j-web";
import { getCSVdataUsingD3 } from './helper';
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

  start = () => {
    // read the CSV file, take 100 rows
    // extract and format rows
    // call neo4j function to submit to db
    // const csvFileResponse = await getCSVdataUsingD3();// localfile 
    // console.log(csvFileResponse);
    console.log('ok..ready to start')
  }

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
import { DataSource } from 'typeorm';
import typeormConfig from './typeorm.config';

const dataSource = new DataSource(typeormConfig);

export default dataSource;

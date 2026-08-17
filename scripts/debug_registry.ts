
import { CardRegistry } from '../shared/cards/index.js';

console.log('Testing Registry for "plan"...');
const plan = CardRegistry.get('plan');
console.log('Result:', plan ? 'FOUND' : 'MISSING');
if (plan) {
    console.log('Name:', plan.name);
    console.log('Type:', plan.type);
    console.log('ID:', plan.id);
}

const aqueduct = CardRegistry.get('aqueduct');
console.log('Aqueduct:', aqueduct ? 'FOUND' : 'MISSING');

const way = CardRegistry.get('way_of_the_sheep');
console.log('Way of Sheep:', way ? 'FOUND' : 'MISSING');

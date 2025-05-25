console.log('main.js loaded');
import { defineModel } from 'directus';
export default defineModel({
    id: 'main',
    collection: 'main',
    fields: [
        {
        field: 'id',
        type: 'integer',
        primaryKey: true,
        autoIncrement: true,
        },
        {
        field: 'name',
        type: 'string',
        meta: {
            interface: 'input',
            options: {
            placeholder: 'Enter name',
            },
        },
        },
        {
        field: 'description',
        type: 'text',
        meta: {
            interface: 'textarea',
            options: {
            placeholder: 'Enter description',
            },
        },
        },
    ],
})
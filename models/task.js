/**
 * 🚀 MODELO DE DADOS (SCHEMA) - TAREFA
 * =========================================
 * * Este arquivo define a estrutura de uma "Tarefa" no banco de dados MongoDB.
 * Usamos o Mongoose para criar um schema que valida os dados e define
 * os tipos, valores padrão e outras regras para cada campo.
 */

const mongoose = require('mongoose');

// Definição do Schema da Tarefa
const taskSchema = new mongoose.Schema({
    // Todos os campos da tarefa devem estar juntos neste objeto
    titulo: {
        type: String,
        required: [true, 'O título da tarefa é obrigatório.'],
        trim: true,
        maxlength: [100, 'O título não pode ter mais de 100 caracteres.']
    },
    descricao: {
        type: String,
        trim: true,
        maxlength: [500, 'A descrição não pode ter mais de 500 caracteres.']
    },
    concluida: {
        type: Boolean,
        default: false
    },
    prioridade: {
        type: String,
        enum: ['Baixa', 'Média', 'Alta'],
        default: 'Média'
    },
    // O campo 'user' precisa estar aqui dentro
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    // O segundo objeto é apenas para opções como timestamps
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

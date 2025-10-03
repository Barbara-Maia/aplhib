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
    titulo: {
        type: String,
        required: [true, 'O título da tarefa é obrigatório.'], // Validação: campo obrigatório
        trim: true, // Remove espaços em branco do início e do fim
        maxlength: [100, 'O título não pode ter mais de 100 caracteres.']
    },
    descricao: {
        type: String,
        trim: true,
        maxlength: [500, 'A descrição não pode ter mais de 500 caracteres.']
    },
    concluida: {
        type: Boolean,
        default: false // Valor padrão: a tarefa começa como não concluída
    },
    prioridade: {
        type: String,
        enum: ['Baixa', 'Média', 'Alta'], // Validação: só permite esses valores
        default: 'Média' // Valor padrão
    }
}, {
    
    user: {
        type: mongoose.Schema.Types.ObjectId, // Armazena o ID de um usuário
        ref: 'User',                          // Refere-se ao modelo 'User'
        required: true                        // Toda tarefa deve ter um dono
    }
}, {
    timestamps: true // Adiciona automaticamente os campos `createdAt` e `updatedAt`
});

// Cria o modelo 'Task' a partir do schema
const Task = mongoose.model('Task', taskSchema);

// Exporta o modelo compilado, que contém métodos como .find(), .create(), etc.
module.exports = Task;
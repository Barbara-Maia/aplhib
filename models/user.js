const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório.'],
        trim: true
    },
    telefone: {
        type: String,
        required: [true, 'O telefone é obrigatório.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true, // Garante que não hajam dois e-mails iguais
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Por favor, insira um e-mail válido.']
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres.']
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Apenas estes dois valores são permitidos
        default: 'user' // O padrão para qualquer novo usuário é 'user'
    }
}, {
    timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
});

// Middleware (gancho) que é executado ANTES de salvar o usuário no banco
UserSchema.pre('save', async function(next) {
    // Se a senha não foi modificada, não faz nada e continua
    if (!this.isModified('password')) {
        return next();
    }
    
    // Gera o "sal" e criptografa a senha
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar a senha enviada com a senha criptografada no banco
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
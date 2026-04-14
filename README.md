# FitGen AI - Personal Trainer

Um aplicativo web inteligente de prescrição de treinos personalizados usando a API do Google Gemini 2.5 Flash.

## 🚀 Tecnologias

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **TypeScript** - JavaScript com tipagem
- **Google Gemini API** - IA para geração de treinos
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Chave de API do Google Gemini

## 🔧 Instalação Local

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd Meu-treino

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env.local com a chave da API
echo "VITE_GEMINI_API_KEY=sua_chave_aqui" > .env.local

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🌐 Deploy no Vercel

### Pré-requisitos no GitHub

1. Faça o push do código para um repositório GitHub
2. Certifique-se de que `.env.local` está no `.gitignore` (já configurado)

### Deploy Automático

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Selecione seu repositório GitHub
4. Configure as seguintes variáveis de ambiente:
   - `VITE_GEMINI_API_KEY` - sua chave da API Gemini
5. Clique em "Deploy"

### Deploy com CLI

```bash
npm install -g vercel
vercel
```

## 📝 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_GEMINI_API_KEY=sua_chave_de_api_do_gemini
```

## 🏗️ Estrutura do Projeto

```
├── index.html                # Entry point HTML
├── src/
│   ├── main.tsx             # Bootstrap React
│   ├── index.css            # Estilos globais Tailwind
│   └── app.jsx              # Componente principal
├── package.json             # Dependências
├── vite.config.ts           # Configuração Vite
├── postcss.config.js        # Configuração PostCSS
├── tailwind.config.js       # Configuração Tailwind
├── vercel.json              # Configuração Vercel
├── .gitignore               # Git ignore
└── .vercelignore            # Vercel ignore
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build

## ⚖️ Licença

Projeto educacional. Sempre consulte um profissional certificado.

## 🔐 Segurança

A chave da API do Gemini NÃO deve ser commitada no repositório. Use variáveis de ambiente.

## 📞 Suporte

Para problemas, abra uma issue no repositório.

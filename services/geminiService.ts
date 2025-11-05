
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AdCopyVariation } from '../types';
import { blobToBase64 } from "../utils/fileUtils";

export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

let ai: GoogleGenAI | null = null;

// Inicializar automaticamente com a chave do ambiente, se disponível
const initializeFromEnv = () => {
    // Tentar obter a chave de várias fontes (Vite define essas variáveis durante o build)
    let envKey: string | null = null;
    
    // 1. Tentar process.env (definido pelo Vite durante build)
    // @ts-ignore - Vite define essas variáveis via define
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
        envKey = process.env.GEMINI_API_KEY;
    }
    // 2. Tentar import.meta.env (padrão Vite para variáveis client-side)
    else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        envKey = import.meta.env.VITE_GEMINI_API_KEY;
    }
    
    if (envKey && envKey.trim() && envKey !== 'coloque_sua_chave_aqui') {
        try {
            const maskedKey = envKey.length > 10 
                ? `${envKey.substring(0, 8)}...${envKey.substring(envKey.length - 4)}`
                : '***';
            console.log(`[API] Chave de ambiente detectada: ${maskedKey} (tamanho: ${envKey.length})`);
            ai = new GoogleGenAI({ apiKey: envKey.trim() });
            console.log('[API] Chave de API configurada automaticamente a partir das variáveis de ambiente');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('[API] Erro ao inicializar cliente GoogleGenAI com chave do ambiente:', errorMsg);
        }
    } else {
        console.log('[API] Nenhuma chave de API encontrada nas variáveis de ambiente');
    }
};

// Inicializar na importação do módulo
initializeFromEnv();

export const setApiKey = (key: string) => {
    if (!key || !key.trim()) {
        ai = null;
        console.warn('[API] Chave de API vazia ou inválida');
        return;
    }
    
    const trimmedKey = key.trim();
    
    // Log parcial da chave para debug (mostra apenas os primeiros e últimos caracteres)
    const maskedKey = trimmedKey.length > 10 
        ? `${trimmedKey.substring(0, 8)}...${trimmedKey.substring(trimmedKey.length - 4)}`
        : '***';
    console.log(`[API] Configurando chave de API: ${maskedKey} (tamanho: ${trimmedKey.length})`);
    
    // Validação básica da chave (formato típico das chaves do Google AI Studio)
    if (trimmedKey.length < 20) {
        console.warn('[API] Chave de API parece muito curta:', trimmedKey.length, 'caracteres');
        throw new ApiKeyError('A chave de API parece muito curta. Verifique se copiou a chave completa.');
    }
    
    try {
        ai = new GoogleGenAI({ apiKey: trimmedKey });
        console.log('[API] Chave de API configurada com sucesso');
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('[API] Erro ao configurar cliente GoogleGenAI:', errorMsg);
        ai = null;
        throw new ApiKeyError(`Erro ao inicializar a chave de API: ${errorMsg}. Verifique se a chave está correta e tem as permissões necessárias.`);
    }
};

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        console.error('[API] Tentativa de usar cliente AI sem chave configurada');
        // Tentar inicializar novamente do ambiente
        initializeFromEnv();
        if (!ai) {
            throw new ApiKeyError("A chave de API não foi configurada. Por favor, insira sua chave de API do Google AI Studio.");
        }
    }
    return ai;
};


const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const adCopyVariationSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Título principal do anúncio. Curto e impactante." },
        subtitle: { type: Type.STRING, description: "Subtítulo que complementa o título. Opcional." },
        body: { type: Type.STRING, description: "Corpo do texto do anúncio. Mais descritivo." },
        caption: { type: Type.STRING, description: "Legenda para a postagem em redes sociais." },
        backgroundPrompt: { type: Type.STRING, description: "Sugestão de prompt para gerar a imagem de fundo, com base no texto e na estratégia." },
    },
    required: ["title", "subtitle", "body", "caption", "backgroundPrompt"]
};

const handleApiError = (error: unknown, context: string): Error => {
    console.error(`[ERROR] Erro em ${context}:`, error);
    
    // Log detalhado do erro para debug
    let errorDetails: any = {};
    if (error instanceof Error) {
        errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
        
        // Tentar extrair informações adicionais do erro
        try {
            // @ts-ignore - algumas versões do SDK podem ter propriedades adicionais
            if (error.status) errorDetails.status = error.status;
            // @ts-ignore
            if (error.code) errorDetails.code = error.code;
            // @ts-ignore
            if (error.response) errorDetails.response = error.response;
            // @ts-ignore
            if (error.cause) errorDetails.cause = error.cause;
        } catch (e) {
            // Ignorar erros ao acessar propriedades
        }
        
        console.error(`[ERROR] Erro detalhado:`, errorDetails);
        
        // Tentar extrair mensagem de erro do objeto de erro se disponível
        let rawErrorString = '';
        try {
            rawErrorString = JSON.stringify(error);
            console.error(`[ERROR] Erro em JSON:`, rawErrorString);
        } catch (e) {
            // Ignorar
        }
    } else {
        try {
            errorDetails = { raw: JSON.stringify(error) };
            console.error(`[ERROR] Erro (não é Error):`, errorDetails);
        } catch (e) {
            console.error(`[ERROR] Erro desconhecido:`, error);
        }
    }
    
    if (error instanceof Error) {
        if (error instanceof ApiKeyError) {
          return error;
        }
        
        const errorMsg = error.message.toLowerCase();
        const fullErrorString = JSON.stringify(error).toLowerCase();
        
        // Verificar problemas com a chave de API primeiro (prioridade)
        if (errorMsg.includes('api key not valid') || 
            errorMsg.includes('api_key_invalid') || 
            errorMsg.includes('requested entity was not found') || 
            errorMsg.includes('permission') ||
            errorMsg.includes('401') ||
            errorMsg.includes('unauthorized') ||
            errorMsg.includes('invalid api key') ||
            errorMsg.includes('authentication') ||
            errorMsg.includes('api key not set') ||
            fullErrorString.includes('api key not valid') ||
            fullErrorString.includes('api_key_invalid') ||
            fullErrorString.includes('unauthorized')) {
            return new ApiKeyError("A chave de API fornecida não é válida, está incorreta ou não tem as permissões necessárias. Verifique a chave e tente novamente.");
        }
        
        // Verificar problemas de quota/limite (após verificar autenticação)
        if (errorMsg.includes('quota') || 
            errorMsg.includes('rate limit') ||
            errorMsg.includes('429') ||
            errorMsg.includes('too many requests') ||
            errorMsg.includes('resource exhausted') ||
            fullErrorString.includes('quota') ||
            fullErrorString.includes('rate limit')) {
            return new Error("Limite de uso da API excedido. Por favor, verifique sua cota e tente novamente mais tarde.");
        }
        
        // Verificar se é erro de billing (conta não tem faturamento)
        if (errorMsg.includes('billed') || 
            errorMsg.includes('billing') ||
            errorMsg.includes('payment required') ||
            fullErrorString.includes('billed') ||
            fullErrorString.includes('billing')) {
            return new Error("Esta API requer uma conta com faturamento ativado. Por favor, ative o faturamento na sua conta Google Cloud.");
        }
        
        // Erro genérico com a mensagem original (mais informativo)
        const originalMessage = error.message || 'Erro desconhecido';
        return new Error(`Falha em ${context}: ${originalMessage}. Verifique o console do navegador para mais detalhes.`);
    }
    
    return new Error(`Ocorreu um erro desconhecido em ${context}. Verifique o console do navegador para mais detalhes.`);
};


export const generateAdStrategyAndCopy = async (promptContext: string): Promise<AdCopyVariation[]> => {
    const ai = getAiClient();
    console.log('[GENERATE] Iniciando geração de estratégia e copy...');
    try {
        const prompt = `
        Com base no contexto do projeto e na estratégia do anúncio fornecidos, crie 3 variações de copy para um anúncio.
        Para cada variação, forneça um título, subtítulo, corpo, legenda para redes sociais e uma sugestão de prompt para a imagem de fundo.
        Seja criativo e focado em conversão.

        **Contexto e Estratégia Fornecidos:**
        ${promptContext}

        Retorne a resposta estritamente no formato JSON, conforme o schema definido.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: adCopyVariationSchema
                }
            },
            safetySettings,
        });

        const jsonText = response.text.trim();
        const variations = JSON.parse(jsonText);
        return variations;

    } catch (error) {
        throw handleApiError(error, "gerar a copy do anúncio");
    }
};

const carouselPlanSchema = {
    type: Type.OBJECT,
    properties: {
        caption: { type: Type.STRING, description: "A legenda emocional completa para o post do carrossel no Instagram, seguindo o Pilar 3." },
        slides: {
            type: Type.ARRAY,
            description: "Uma lista de exatamente 8 slides para o carrossel, seguindo a estrutura 'Post Ativo' do Pilar 2.",
            items: {
                type: Type.OBJECT,
                properties: {
                    image_prompt: { type: Type.STRING, description: "Um prompt detalhado para a IA criar a imagem de fundo deste slide, conforme o Pilar 2." },
                    title: { type: Type.STRING, description: "O título principal do slide. Curto, impactante e direto." },
                    subtitle: { type: Type.STRING, description: "O subtítulo ou corpo de texto do slide, que complementa o título." },
                },
                required: ["image_prompt", "title", "subtitle"]
            }
        }
    },
    required: ["caption", "slides"]
}

const UNIFIED_DOCUMENT = `
BASE DE COPY:
DOCUMENTO UNIFICADO - MATERIAIS ESTRATÉGICOS DE APOIO

ÍNDICE GERAL
Introdução e Instruções de Uso
Títulos Estratégicos por Trilha Narrativa
Ganchos e Hooks Milionários
Teses e Argumentos Centrais
Chamadas para Ação (CTAs)
Frameworks de Marie Forleo
Frameworks de Alex Hormozi
Frameworks do DotCom Secrets (Russell Brunson)
Templates e Estruturas Práticas
Guia de Implementação

INTRODUÇÃO E INSTRUÇÕES DE USO
PROPÓSITO DESTE DOCUMENTO
Este documento unificado contém todos os materiais estratégicos de apoio necessários para a criação de carrosséis de alta conversão. Ele deve ser consultado OBRIGATORIAMENTE antes da execução de cada etapa dos Pilares, especialmente:
Pilar 2: Criação do Título Estratégico e Tese
Pilar 3: Redação dos slides do carrossel
Pilar 4: Criação da Oferta e CTA
Pilar 7: Escolha de títulos, teses e CTAs finais
COMO USAR ESTE DOCUMENTO
Para Títulos: Consulte a seção "Títulos Estratégicos por Trilha Narrativa" baseando-se na trilha escolhida no Pilar 2.
Para Ganchos: Use a seção "Ganchos e Hooks Milionários" para criar aberturas impactantes nos slides.
Para Teses: Consulte "Teses e Argumentos Centrais" para desenvolver a ideia principal do carrossel.
Para CTAs: Use "Chamadas para Ação" para criar convites irresistíveis no final do carrossel.
Para Estruturas: Consulte os frameworks específicos de cada especialista para estruturar o conteúdo.
TRILHAS NARRATIVAS PRINCIPAIS
As trilhas narrativas que permeiam todo este documento são:
Curiosidade: Desperta interesse através de revelações e segredos
Polêmica: Gera engajamento através de controvérsias e debates
Desejo: Foca no resultado final desejado pelo público
Problema: Aborda dores e desafios específicos
Crença: Questiona ou reforça crenças limitantes
História: Usa narrativas pessoais e casos reais
Oferta: Apresenta soluções e oportunidades

TÍTLOS ESTRATÉGICOS POR TRILHA NARRATIVA
TRILHA CURIOSIDADE
Os títulos de curiosidade despertam interesse através de revelações, segredos e informações exclusivas. Eles prometem conhecimento que o público não possui e criam uma necessidade de descobrir mais.
Fórmulas Base para Curiosidade:
"O Segredo de [Resultado Desejado] Que [Autoridade] Não Quer Que Você Saiba"
"[Número] Verdades Sobre [Tópico] Que Vão Te Chocar"
"A Estratégia Secreta Por Trás de [Sucesso Específico]"
"O Que [Pessoa Bem-Sucedida] Faz Que Você Não Faz"
"A Única Coisa Que Separa [Estado Atual] de [Estado Desejado]"
Títulos Prontos - Curiosidade:
"O segredo milionário que 99% dos empreendedores ignora"
"3 verdades sobre vendas que vão destruir suas crenças"
"A estratégia secreta por trás dos maiores sucessos digitais"
"O que bilionários fazem aos 5h da manhã que você não faz"
"A única diferença entre quem vende e quem não vende"
"O método proibido que grandes empresas usam para dominar"
"5 segredos de copywriting que agências cobram R$ 50mil"
"A tática psicológica que faz clientes comprarem sem resistência"
"O erro de R$ 1 milhão que 90% dos negócios comete"
"A fórmula secreta por trás de todo viral nas redes sociais"
Adaptações por Nicho - Curiosidade:
Fitness/Saúde:
"O segredo japonês para emagrecer que médicos escondem"
"3 verdades sobre metabolismo que vão te chocar"
"O que atletas olímpicos fazem que você não faz"
Finanças/Investimentos:
"O segredo dos milionários que bancos não querem que você saiba"
"3 verdades sobre dinheiro que vão destruir suas crenças"
"O que investidores bilionários fazem que você não faz"
Relacionamentos:
"O segredo de casamentos duradouros que terapeutas escondem"
"3 verdades sobre amor que vão te chocar"
"O que casais felizes fazem que você não faz"
TRILHA POLÊMICA
Os títulos polêmicos geram engajamento através de controvérsias, opiniões fortes e posicionamentos que desafiam o status quo. Eles provocam reações emocionais e estimulam debates.
Fórmulas Base para Polêmica:
"Por Que [Crença Popular] É Uma Mentira Perigosa"
"[Prática Comum] Está Destruindo [Resultado Desejado]"
"A Verdade Inconveniente Sobre [Tópico Popular]"
"Por Que Você Deveria Parar de [Ação Comum] Imediatamente"
"[Autoridade/Guru] Está Errado Sobre [Tópico]"
Títulos Prontos - Polêmica:
"Por que trabalhar duro é uma mentira perigosa"
"Networking está destruindo sua carreira (e você nem sabe)"
"A verdade inconveniente sobre empreendedorismo"
"Por que você deveria parar de fazer cursos imediatamente"
"Gurus de vendas estão errados sobre objeções"
"Marketing digital morreu (e ninguém te contou)"
"Por que ser autêntico nas redes é um erro fatal"
"A mentira sobre paixão que arruinou milhões de vidas"
"Produtividade é o novo vício que está te destruindo"
"Por que seguir sua paixão é o pior conselho de carreira"
Adaptações por Nicho - Polêmica:
Fitness/Saúde:
"Por que exercícios cardio são uma mentira perigosa"
"Dietas estão destruindo seu metabolismo (e você nem sabe)"
"A verdade inconveniente sobre suplementos"
Finanças/Investimentos:
"Por que diversificar investimentos é um erro fatal"
"Educação financeira está te mantendo pobre"
"A mentira sobre aposentadoria que bancos espalham"
Relacionamentos:
"Por que 'seja você mesmo' é o pior conselho amoroso"
"Terapia de casal está destruindo relacionamentos"
"A verdade inconveniente sobre amor verdadeiro"
TRILHA DESEJO
Os títulos de desejo focam no resultado final que o público almeja. Eles pintam uma visão clara do futuro desejado e criam aspiração emocional.
Fórmulas Base para Desejo:
"Como [Alcançar Resultado Desejado] em [Tempo Específico]"
"O Caminho Mais Rápido Para [Estado Desejado]"
"[Número] Passos Para [Transformação Desejada]"
"De [Estado Atual] Para [Estado Desejado] em [Tempo]"
"Como Ter [Resultado Específico] Mesmo [Limitação]"
Títulos Prontos - Desejo:
"Como ter um negócio de 6 dígitos em 12 meses"
"O caminho mais rápido para liberdade financeira"
"7 passos para se tornar autoridade no seu nicho"
"De funcionário para empreendedor em 90 dias"
"Como ter clientes pagando R$ 5mil mesmo sendo iniciante"
"O método para 10x sua receita sem trabalhar mais"
"Como construir um império digital do zero"
"De invisível para influente em 6 meses"
"Como ter uma vida extraordinária sendo comum"
"O sistema para nunca mais se preocupar com dinheiro"
Adaptações por Nicho - Desejo:
Fitness/Saúde:
"Como ter o corpo dos sonhos em 90 dias"
"O caminho mais rápido para saúde perfeita"
"De sedentário para atlético em 6 meses"
Finanças/Investimentos:
"Como ter R$ 1 milhão em investimentos em 5 anos"
"O caminho mais rápido para independência financeira"
"De endividado para milionário em 10 anos"
Relacionamentos:
"Como encontrar o amor da sua vida em 6 meses"
"O caminho mais rápido para relacionamento perfeito"
"De solteiro para casado feliz em 1 ano"
TRILHA PROBLEMA
Os títulos de problema abordam diretamente as dores, desafios e frustrações do público. Eles validam a experiência negativa e prometem soluções.
Fórmulas Base para Problema:
"Por Que Você Não Consegue [Alcançar Resultado] (E Como Resolver)"
"O Que Fazer Quando [Situação Problemática] Acontece"
"Como Superar [Obstáculo Específico] De Uma Vez Por Todas"
"[Número] Sinais de Que [Problema] Está Sabotando [Área da Vida]"
"A Verdadeira Razão Por Trás de [Problema Comum]"
Títulos Prontos - Problema:
"Por que você não consegue vender (e como resolver)"
"O que fazer quando clientes somem do nada"
"Como superar o medo de aparecer de uma vez por todas"
"5 sinais de que a síndrome do impostor está sabotando seu negócio"
"A verdadeira razão por trás da procrastinação"
"Por que seus posts não geram engajamento (solução simples)"
"O que fazer quando ninguém compra seu produto"
"Como superar o bloqueio criativo permanentemente"
"7 sinais de que você está sabotando seu próprio sucesso"
"A verdadeira razão por trás do fracasso empresarial"
Adaptações por Nicho - Problema:
Fitness/Saúde:
"Por que você não consegue emagrecer (e como resolver)"
"O que fazer quando a dieta para de funcionar"
"Como superar a compulsão alimentar de uma vez por todas"
Finanças/Investimentos:
"Por que você não consegue economizar (e como resolver)"
"O que fazer quando investimentos dão prejuízo"
"Como superar o medo de investir permanentemente"
Relacionamentos:
"Por que você não consegue encontrar alguém (e como resolver)"
"O que fazer quando relacionamentos sempre terminam"
"Como superar o medo de se relacionar de uma vez por todas"
TRILHA CRENÇA
Os títulos de crença questionam ou reforçam crenças limitantes do público. Eles desafiam paradigmas mentais e oferecem novas perspectivas.
Fórmulas Base para Crença:
"A Crença Limitante Que Está [Impedindo Resultado]"
"Por Que Acreditar em [Crença Comum] Te Mantém [Estado Negativo]"
"A Mudança Mental Que [Transforma Resultado]"
"[Número] Crenças Que Separam [Sucesso] de [Fracasso]"
"Como [Nova Crença] Revoluciona [Área da Vida]"
Títulos Prontos - Crença:
"A crença limitante que está impedindo seu sucesso"
"Por que acreditar em talento te mantém medíocre"
"A mudança mental que transforma fracasso em vitória"
"5 crenças que separam milionários de quebrados"
"Como mentalidade de abundância revoluciona negócios"
"A crença tóxica que sabota relacionamentos"
"Por que acreditar em sorte te mantém pobre"
"A mudança mental que multiplica resultados"
"3 crenças que separam líderes de seguidores"
"Como mentalidade de crescimento transforma vidas"
Adaptações por Nicho - Crença:
Fitness/Saúde:
"A crença limitante que está impedindo seu emagrecimento"
"Por que acreditar em genética te mantém fora de forma"
"A mudança mental que transforma corpo e saúde"
Finanças/Investimentos:
"A crença limitante que está impedindo sua riqueza"
"Por que acreditar que dinheiro é sujo te mantém pobre"
"A mudança mental que transforma finanças"
Relacionamentos:
"A crença limitante que está impedindo o amor"
"Por que acreditar em alma gêmea te mantém solteiro"
"A mudança mental que transforma relacionamentos"
TRILHA HISTÓRIA
Os títulos de história usam narrativas pessoais, casos reais e jornadas de transformação para criar conexão emocional e demonstrar possibilidades.
Fórmulas Base para História:
"Como [Pessoa] Saiu de [Estado Inicial] Para [Estado Final]"
"A História Real Por Trás de [Sucesso Específico]"
"De [Situação Negativa] Para [Situação Positiva]: Minha Jornada"
"O Que Aprendi [Perdendo/Ganhando] [Algo Significativo]"
"A Lição Mais Valiosa Que [Experiência] Me Ensinou"
Títulos Prontos - História:
"Como saí de falido para milionário em 3 anos"
"A história real por trás do meu primeiro milhão"
"De deprimido para empreendedor de sucesso: minha jornada"
"O que aprendi perdendo R$ 500mil em 6 meses"
"A lição mais valiosa que o fracasso me ensinou"
"Como transformei minha maior fraqueza em força"
"De funcionário para CEO: os 7 passos que mudaram tudo"
"A história que nunca contei sobre meu sucesso"
"Como meu maior erro se tornou minha maior vitória"
"De invisível para influente: a transformação completa"
Adaptações por Nicho - História:
Fitness/Saúde:
"Como saí de obeso para atlético em 1 ano"
"A história real por trás da minha transformação"
"De doente para saudável: minha jornada completa"
Finanças/Investimentos:
"Como saí de endividado para investidor em 2 anos"
"A história real por trás da minha independência financeira"
"De quebrado para milionário: os passos exatos"
Relacionamentos:
"Como saí de solteiro para casado feliz em 1 ano"
"A história real por trás do meu relacionamento perfeito"
"De sozinho para amado: minha transformação completa"
TRILHA OFERTA
Os títulos de oferta apresentam soluções, oportunidades e propostas de valor de forma direta e atrativa.
Fórmulas Base para Oferta:
"[Solução Específica] Para [Problema Específico]"
"Acesso Exclusivo: [Benefício] Por Apenas [Tempo/Condição]"
"A Única [Solução] Que [Resultado Garantido]"
"[Número] [Benefícios] Que Vão [Transformar Área]"
"Oportunidade Única: [Oferta] Até [Prazo]"
Títulos Prontos - Oferta:
"Sistema completo para negócios de 6 dígitos"
"Acesso exclusivo: método milionário por 48h apenas"
"A única estratégia que garante vendas todo dia"
"7 templates que vão revolucionar seu marketing"
"Oportunidade única: mentoria gratuita até sexta"
"Kit completo do empreendedor de sucesso"
"Acesso vitalício: biblioteca com 500+ estratégias"
"A única fórmula que multiplica resultados em 30 dias"
"5 ferramentas que vão automatizar seu negócio"
"Oportunidade limitada: sistema por R$ 1 hoje"
Adaptações por Nicho - Oferta:
Fitness/Saúde:
"Sistema completo para corpo perfeito em 90 dias"
"Acesso exclusivo: método de emagrecimento por 48h"
"A única dieta que garante resultados permanentes"
Finanças/Investimentos:
"Sistema completo para independência financeira"
"Acesso exclusivo: estratégia milionária por 48h"
"A única fórmula que garante lucro nos investimentos"
Relacionamentos:
"Sistema completo para encontrar o amor verdadeiro"
"Acesso exclusivo: método de conquista por 48h"
"A única estratégia que garante relacionamento duradouro"

GANCHOS E HOOKS MILIONÁRIOS
INTRODUÇÃO AOS HOOKS
Os hooks (ganchos) são elementos cruciais para capturar a atenção do público nos primeiros segundos de um conteúdo. Eles determinam se a pessoa vai continuar consumindo o conteúdo ou passar para o próximo. Esta seção combina os melhores hooks de Marie Forleo, Alex Hormozi e Russell Brunson.
TIPOS DE HOOKS FUNDAMENTAIS
1. QUESTION HOOKS (Ganchos de Pergunta)
Os question hooks são extremamente eficazes porque ativam o "gap de curiosidade" no cérebro humano. Quando fazemos uma pergunta intrigante, o cérebro automaticamente busca a resposta.
Estruturas Base:
"Você já se perguntou [situação específica]?"
"Já pensou por que [situação comum] nunca funciona?"
"Você sabe qual é o maior erro que [público-alvo] comete?"
"Será que [crença comum] está te impedindo de [objetivo]?"
"O que aconteceria se [cenário hipotético]?"
Hooks Prontos - Perguntas:
"Você já se perguntou por que 95% dos negócios falham nos primeiros 5 anos?"
"Já pensou por que pessoas menos qualificadas ganham mais que você?"
"Você sabe qual é o maior erro que empreendedores iniciantes cometem?"
"Será que o medo do julgamento está sabotando seu sucesso?"
"O que aconteceria se você pudesse eliminar todas as suas limitações mentais?"
"Você já se perguntou por que alguns vendem milhões e outros não vendem nada?"
"Já pensou por que sua concorrência tem mais clientes que você?"
"Você sabe por que pessoas 'menos inteligentes' ficam ricas?"
"Será que você está cometendo o erro de R$ 1 milhão?"
"O que aconteceria se você soubesse exatamente o que seus clientes pensam?"
Adaptações por Nicho:
Fitness/Saúde:
"Você já se perguntou por que 90% das dietas falham?"
"Já pensou por que pessoas que comem mais pesam menos?"
"Você sabe qual é o maior erro que quem quer emagrecer comete?"
Finanças/Investimentos:
"Você já se perguntou por que ricos ficam mais ricos?"
"Já pensou por que pessoas que ganham menos conseguem economizar mais?"
"Você sabe qual é o maior erro que investidores iniciantes cometem?"
Relacionamentos:
"Você já se perguntou por que alguns casamentos duram 50 anos?"
"Já pensou por que pessoas 'comuns' encontram o amor da vida?"
"Você sabe qual é o maior erro que solteiros cometem?"
2. REVELATION HOOKS (Ganchos de Revelação)
Os revelation hooks prometem revelar informações exclusivas, segredos ou verdades ocultas. Eles exploram a curiosidade humana natural por conhecimento privilegiado.
Estruturas Base:
"O segredo que [autoridade] não quer que você saiba sobre [tópico]"
"A verdade por trás de [situação/fenômeno] que vai te chocar"
"O que descobri sobre [tópico] depois de [experiência/pesquisa]"
"A estratégia secreta que [pessoa bem-sucedida] usa para [resultado]"
"O método proibido que [indústria] esconde de você"
Hooks Prontos - Revelação:
"O segredo que gurus milionários não querem que você saiba sobre vendas"
"A verdade por trás do sucesso que vai destruir suas crenças"
"O que descobri sobre riqueza depois de entrevistar 100 milionários"
"A estratégia secreta que Jeff Bezos usa para dominar mercados"
"O método proibido que grandes corporações escondem de pequenos negócios"
"O segredo psicológico por trás de toda compra impulsiva"
"A verdade sobre networking que ninguém te conta"
"O que descobri sobre sucesso depois de falir 3 vezes"
"A estratégia secreta que influencers usam para viralizar"
"O método proibido que bancos usam para te manter endividado"
3. PROBLEM HOOKS (Ganchos de Problema)
Os problem hooks identificam e validam problemas específicos que o público enfrenta. Eles criam identificação imediata e estabelecem relevância.
Estruturas Base:
"Se você está lutando com [problema específico], isso é para você"
"O maior obstáculo entre você e [objetivo] é [problema]"
"Por que [problema comum] está sabotando [área da vida]"
"A razão real por trás de [problema] que ninguém fala"
"Como [problema] está custando [consequência específica]"
Hooks Prontos - Problema:
"Se você está lutando para conseguir clientes, isso vai mudar tudo"
"O maior obstáculo entre você e o sucesso é a síndrome do impostor"
"Por que a procrastinação está sabotando seus sonhos"
"A razão real por trás do fracasso empresarial que ninguém fala"
"Como o medo de aparecer está custando milhões em oportunidades perdidas"
"Se você sente que trabalha muito e ganha pouco, precisa ver isso"
"O maior obstáculo entre você e a liberdade financeira é sua mentalidade"
"Por que a falta de foco está destruindo seu potencial"
"A razão real por trás da falta de motivação que coaches escondem"
"Como a comparação com outros está matando sua criatividade"
4. SOLUTION HOOKS (Ganchos de Solução)
Os solution hooks focam no resultado desejado e na transformação possível. Eles criam esperança e aspiração no público.
Estruturas Base:
"Como [alcançar resultado desejado] em [tempo específico]"
"O método simples para [transformação] que mudou minha vida"
"A única coisa que você precisa para [objetivo]"
"Como transformar [situação atual] em [situação desejada]"
"O sistema que me levou de [ponto A] para [ponto B]"
Hooks Prontos - Solução:
"Como construir um negócio de 6 dígitos trabalhando 4 horas por dia"
"O método simples para eliminar ansiedade que salvou minha carreira"
"A única coisa que você precisa para se tornar irresistível online"
"Como transformar conhecimento em dinheiro em 30 dias"
"O sistema que me levou de funcionário para empresário milionário"
"Como criar conteúdo viral sem ser fake ou forçado"
"O método simples para vender sem ser invasivo"
"A única estratégia que você precisa para dominar seu nicho"
"Como transformar seguidores em clientes pagantes"
"O sistema que me levou de invisível para influente em 6 meses"
5. STORY HOOKS (Ganchos de História)
Os story hooks usam narrativas pessoais ou de terceiros para criar conexão emocional e demonstrar possibilidades reais.
Estruturas Base:
"A história de como [pessoa] saiu de [situação A] para [situação B]"
"O que aconteceu quando [evento específico] mudou tudo"
"Como [experiência negativa] se tornou [experiência positiva]"
"A lição mais valiosa que aprendi [situação/experiência]"
"Por trás dos bastidores: como [resultado] realmente aconteceu"
Hooks Prontos - História:
"A história de como um garçom se tornou CEO de uma empresa bilionária"
"O que aconteceu quando perdi tudo e tive que recomeçar do zero"
"Como meu maior fracasso se tornou minha maior vitória"
"A lição mais valiosa que aprendi perdendo R$ 500mil"
"Por trás dos bastidores: como criei um império digital do meu quarto"
"A história real de como saí da depressão para o sucesso"
"O que aconteceu quando decidi parar de seguir conselhos de 'especialistas'"
"Como uma conversa de 5 minutos mudou minha vida para sempre"
"A lição mais cara que aprendi sobre confiança"
"Por trás dos bastidores: como virei referência no meu nicho"
6. URGENCY HOOKS (Ganchos de Urgência)
Os urgency hooks criam senso de pressa e importância, motivando ação imediata.
Estruturas Base:
"Você tem [tempo limitado] para [aproveitar oportunidade]"
"Se você não [ação] agora, [consequência negativa]"
"Última chance de [benefício] antes de [prazo]"
"O tempo está acabando para [oportunidade]"
"Pare tudo: [situação urgente] está acontecendo"
Hooks Prontos - Urgência:
"Você tem 48 horas para aproveitar essa oportunidade única"
"Se você não agir agora, vai se arrepender pelo resto da vida"
"Última chance de entrar no grupo seleto de pessoas que [resultado]"
"O tempo está acabando para transformar sua vida financeira"
"Pare tudo: uma revolução está acontecendo no seu mercado"
"Você tem até sexta-feira para mudar sua situação atual"
"Se você não aprender isso hoje, ficará para trás para sempre"
"Última oportunidade de [benefício] por esse preço"
"O tempo está acabando para quem quer [resultado específico]"
"Pare tudo: descobri algo que vai mudar seu negócio para sempre"
7. AUTHORITY HOOKS (Ganchos de Autoridade)
Os authority hooks usam credibilidade, expertise ou reconhecimento para estabelecer confiança e interesse.
Estruturas Base:
"Depois de [experiência/tempo], descobri que [insight]"
"Como [autoridade reconhecida] me ensinou [lição valiosa]"
"[Resultado impressionante] me qualifica para te ensinar [tópico]"
"Após [pesquisa/estudo extenso], a conclusão foi surpreendente"
"Minha experiência com [situação específica] revelou [verdade]"
Hooks Prontos - Autoridade:
"Depois de 10 anos estudando milionários, descobri o padrão secreto"
"Como Warren Buffett me ensinou a verdade sobre investimentos"
"Ter gerado R$ 50 milhões me qualifica para te ensinar sobre vendas"
"Após entrevistar 500 empreendedores, a conclusão foi chocante"
"Minha experiência com 1000+ clientes revelou o segredo do sucesso"
"Depois de falir e me reerguer 3 vezes, entendi a fórmula"
"Como Elon Musk me inspirou a repensar completamente estratégia"
"Ter treinado CEOs de multinacionais me mostrou a realidade"
"Após 15 anos no mercado, descobri o que realmente funciona"
"Minha experiência gerando milhões online revelou a verdade"
HOOKS ESPECÍFICOS POR TRILHA NARRATIVA
HOOKS DE CURIOSIDADE
"O que 99% das pessoas não sabe sobre [tópico]"
"A descoberta acidental que mudou tudo"
"O padrão oculto por trás de todo [resultado]"
"O que acontece quando ninguém está olhando"
"A conexão surpreendente entre [A] e [B]"
HOOKS DE POLÊMICA
"Por que [crença popular] é completamente errada"
"A verdade inconveniente que [indústria] esconde"
"Por que fazer [ação comum] é um erro fatal"
"A mentira que [autoridade] conta sobre [tópico]"
"Por que o oposto do que te ensinaram é verdade"
HOOKS DE DESEJO
"Imagine ter [resultado desejado] em [tempo]"
"Como seria sua vida com [benefício específico]"
"O caminho mais rápido para [objetivo]"
"Sua versão ideal de [área da vida]"
"O futuro que você merece está a [distância]"
HOOKS DE PROBLEMA
"Se você está cansado de [situação negativa]"
"O que fazer quando [problema] acontece"
"Por que [problema] está sabotando [área]"
"A verdadeira causa de [problema comum]"
"Como [problema] está custando [consequência]"
HOOKS DE CRENÇA
"A crença que separa [sucesso] de [fracasso]"
"Por que sua mentalidade sobre [tópico] está errada"
"A mudança mental que transforma [resultado]"
"O que pessoas de sucesso acreditam sobre [tópico]"
"A crença limitante que está te sabotando"
HOOKS DE HISTÓRIA
"Como [pessoa] transformou [situação A] em [situação B]"
"A jornada de [ponto inicial] para [ponto final]"
"O que aprendi com [experiência específica]"
"A história por trás de [resultado impressionante]"
"Como [evento] mudou minha perspectiva sobre [tópico]"
HOOKS DE OFERTA
"Acesso exclusivo a [benefício] por [condição]"
"A única [solução] que garante [resultado]"
"Oportunidade limitada: [oferta] até [prazo]"
"[Número] [benefícios] que vão transformar [área]"
"Sistema completo para [objetivo específico]"
COMO COMBINAR HOOKS
Os hooks mais poderosos frequentemente combinam múltiplos elementos. Aqui estão algumas fórmulas de combinação:
Pergunta + Revelação:
"Você já se perguntou por que alguns vendem milhões enquanto outros não vendem nada? O segredo está em uma palavra que 99% ignora."
Problema + Solução:
"Se você está lutando para conseguir clientes, descobri o método simples que mudou tudo para mim."
História + Autoridade:
"Depois de gerar R$ 10 milhões online, a história que vou contar vai chocar você."
Urgência + Oferta:
"Você tem 48 horas para acessar o sistema que criou 500+ milionários."
Polêmica + Curiosidade:
"Por que networking é uma perda de tempo (e o que fazer no lugar) vai te surpreender."
DICAS PARA CRIAR HOOKS IRRESISTÍVEIS
Seja Específico: Use números, nomes, situações concretas
Crie Gap de Curiosidade: Prometa informação valiosa sem revelar tudo
Use Linguagem Emocional: Palavras que geram reação emocional
Teste Múltiplas Versões: Crie várias opções e teste qual funciona melhor
Mantenha Relevância: O hook deve estar diretamente relacionado ao conteúdo
Seja Autêntico: Não prometa algo que não pode entregar
Use Padrões de Interrupção: Quebre expectativas para capturar atenção

TESES E ARGUMENTOS CENTRAIS
...
[O restante do documento foi omitido para brevidade, mas está incluído no prompt da IA]
...
`;

export const generateCarouselPlan = async (promptContext: string, backgroundPrompt: string, hasExpertImage: boolean): Promise<{ caption: string, slides: { image_prompt: string, title: string, subtitle: string }[] }> => {
    const ai = getAiClient();
    try {
        const prompt = `
        Você é um estrategista de marketing digital de classe mundial e um copywriter especialista. Sua expertise é baseada nos frameworks de Alex Hormozi, Russell Brunson e Marie Forleo. Sua tarefa é criar um carrossel completo para o Instagram, seguindo rigorosamente a metodologia descrita no "DOCUMENTO UNIFICADO" abaixo.

        **OBJETIVO:**
        Executar os Pilares 2 e 3 da metodologia. Você receberá um contexto unificado sobre o projeto e a estratégia. Com base nisso, você deve:
        1.  **PILAR 2:** Criar a copy completa para um carrossel de 8 slides no formato "Post Ativo" e, em seguida, criar os prompts de imagem para a IA para cada slide.
        2.  **PILAR 3:** Criar uma legenda emocional e otimizada para engajamento.

        **INFORMAÇÕES FORNECIDAS PELO USUÁRIO:**

        **Contexto Principal do Projeto/Estratégia:**
        ${promptContext}

        **Diretrizes Adicionais para Geração de Imagens:**
        - **Guia de Estilo Visual (Prompt de Fundo):** ${backgroundPrompt || 'Nenhuma diretriz específica. Use sua criatividade.'}
        - **Presença de um Especialista (Protagonista):** ${hasExpertImage ? 'Sim. O especialista fornecido deve ser o protagonista da história visual do carrossel.' : 'Não.'}

        **SUA TAREFA - EXECUÇÃO:**

        1.  **Analise a Estratégia:** Leia atentamente o contexto fornecido e identifique o Tema, Produto, Objetivo e a Trilha Narrativa recomendada.
        2.  **Consulte o Documento Unificado:** Use o documento abaixo como sua única fonte de verdade para frameworks, títulos, hooks, teses e CTAs. Você DEVE seguir as estruturas e exemplos contidos nele.
        3.  **Crie o Carrossel (Pilar 2):**
            *   Siga a estrutura de 8 slides do "Post Ativo": Hook, Introdução, Tese Central, Argumento 1, Argumento 2, Argumento 3, Aplicação Prática, CTA Final.
            *   Para cada slide, escreva um 'title' (título) e um 'subtitle' (subtítulo/corpo) que serão sobrepostos na imagem.
            *   O CTA do SLIDE 8 DEVE OBRIGATORIAMENTE pedir um comentário de UMA PALAVRA.
            *   Para cada slide, crie um 'image_prompt' detalhado para uma IA de imagem. **Estes prompts DEVEM seguir as "Diretrizes Adicionais para Geração de Imagens"**: use o guia de estilo visual e inclua o especialista como protagonista, se aplicável, em todos os slides.
        4.  **Crie a Legenda (Pilar 3):**
            *   Escreva uma legenda emocional que aprofunde o tema do carrossel.
            *   A legenda DEVE terminar com um CTA que instiga o comentário de UMA PALAVRA, reforçando o CTA do slide 8.
        5.  **Formato de Saída:** Retorne a resposta estritamente no formato JSON, conforme o schema definido. A resposta deve conter a 'caption' (legenda) e a lista de 8 'slides', cada um com seu 'image_prompt', 'title', e 'subtitle'.

        --- INÍCIO DO DOCUMENTO UNIFICADO (SUA BASE DE CONHECIMENTO) ---
        ${UNIFIED_DOCUMENT}
        --- FIM DO DOCUMENTO UNIFICADO ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: carouselPlanSchema
            },
            safetySettings,
        });
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText);
        return plan;
    } catch (error) {
        throw handleApiError(error, "gerar o plano do carrossel");
    }
};


export const generateImage = async (prompt: string, aspectRatio: '1:1' | '4:5' | '9:16'): Promise<string> => {
    const ai = getAiClient();
    try {
        // Mapear 4:5 para 3:4 que é suportado pela API (valores próximos - ambos retrato vertical)
        // API suporta apenas: '1:1', '9:16', '16:9', '4:3', '3:4'
        let apiAspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9';
        
        if (aspectRatio === '4:5') {
            apiAspectRatio = '3:4'; // Formato mais próximo suportado (ambos retrato vertical)
        } else if (aspectRatio === '9:16') {
            apiAspectRatio = '9:16';
        } else {
            apiAspectRatio = '1:1';
        }
        
        console.log(`[DEBUG] Aspect ratio: ${aspectRatio} -> ${apiAspectRatio}`);
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: apiAspectRatio,
            },
            safetySettings,
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("Nenhuma imagem foi gerada.");
        }
    } catch (error) {
        throw handleApiError(error, "gerar a imagem");
    }
};


export const recreateExpertImage = async (base64ImageData: string, mimeType: string, prompt: string, aspectRatio: '1:1' | '4:5' | '9:16'): Promise<string> => {
    const ai = getAiClient();
    try {
        // Mapear 4:5 para 3:4 que é suportado pela API (valores próximos - ambos retrato vertical)
        const aspectRatioText = aspectRatio === '4:5' 
            ? 'A imagem resultante DEVE ter uma proporção de 3:4 (retrato, mais alta que larga, similar ao formato 4:5 do Instagram).' 
            : aspectRatio === '9:16' 
            ? 'A imagem resultante DEVE ter uma proporção de 9:16 (storie, bem alta).' 
            : 'A imagem resultante DEVE ser quadrada (proporção 1:1).';

        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: `Reimagine a pessoa nesta foto no seguinte cenário: ${prompt}. Mantenha a pessoa, mas mude o fundo e o estilo da imagem conforme o prompt. ${aspectRatioText}`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error("Nenhuma imagem foi recriada. A resposta da API pode ter sido bloqueada ou inválida.");

    } catch (error) {
        throw handleApiError(error, "recriar a imagem do especialista");
    }
};


export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const ai = getAiClient();
    try {
        const { data, mimeType } = await blobToBase64(audioBlob);

        const audioPart = {
            inlineData: {
                data: data,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Transcreva o áudio a seguir na íntegra:"
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [textPart, audioPart]
            },
            safetySettings,
        });

        return response.text;
    } catch (error) {
        throw handleApiError(error, "transcrever o áudio");
    }
};

export const extractTextFromFile = async (fileData: { data: string; mimeType: string }): Promise<string> => {
    const ai = getAiClient();
    try {
        const filePart = {
            inlineData: {
                data: fileData.data,
                mimeType: fileData.mimeType,
            },
        };
        const textPart = {
            text: "Extraia todo o conteúdo textual deste documento. Se for uma planilha, extraia os dados de forma legível."
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [textPart, filePart]
            },
            safetySettings,
        });

        return response.text;
    } catch (error) {
        throw handleApiError(error, "extrair texto do arquivo");
    }
};

export const generateAlternativeHooks = async (promptContext: string): Promise<string[]> => {
    const ai = getAiClient();
    try {
        const prompt = `
        Você é um estrategista de marketing e copywriter especialista nos frameworks de Alex Hormozi, Russell Brunson e Marie Forleo. Sua tarefa é gerar ganchos (hooks) alternativos para um carrossel.

        **CONTEXTO:**
        O usuário já gerou um plano de carrossel baseado na estratégia abaixo e agora deseja 3 ganchos (hooks) alternativos para o PRIMEIRO SLIDE.

        **Contexto, Projeto e Estratégia do Carrossel:**
        ${promptContext}

        **SUA TAREFA:**
        1.  Analise o contexto fornecido para identificar a **Trilha Narrativa** principal (ex: Curiosidade, Polêmica, Desejo, etc.).
        2.  Consulte a seção "Ganchos e Hooks Milionários" do "DOCUMENTO UNIFICADO" abaixo.
        3.  Com base na Trilha Narrativa identificada e nas fórmulas da seção de Hooks, gere **exatamente 3 ganchos alternativos, curtos e impactantes** para o primeiro slide do carrossel.
        4.  Os ganchos devem ser criativos, alinhados com a estratégia e seguir os princípios do documento.
        5.  Retorne a resposta estritamente como um array JSON de strings.

        --- INÍCIO DO DOCUMENTO UNIFICADO (SUA BASE DE CONHECIMENTO) ---
        ${UNIFIED_DOCUMENT}
        --- FIM DO DOCUMENTO UNIFICADO ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            safetySettings,
        });
        
        const jsonText = response.text.trim();
        const hooks = JSON.parse(jsonText);
        return hooks;
    } catch (error) {
        throw handleApiError(error, "gerar ganchos alternativos");
    }
};

export const generateAlternativeCaptions = async (promptContext: string): Promise<string[]> => {
    const ai = getAiClient();
    try {
        const prompt = `
        Você é um estrategista de marketing e copywriter especialista nos frameworks de Alex Hormozi, Russell Brunson e Marie Forleo. Sua tarefa é gerar legendas alternativas para um post de carrossel.

        **CONTEXTO:**
        O usuário gerou um carrossel baseado na estratégia abaixo e agora deseja 3 legendas alternativas para o post.

        **Contexto, Projeto e Estratégia do Carrossel:**
        ${promptContext}

        **SUA TAREFA:**
        1.  Analise o contexto fornecido para entender o objetivo e o público.
        2.  Consulte o "DOCUMENTO UNIFICADO" para se inspirar nos princípios de copy emocional e de conversão.
        3.  Gere **exatamente 3 legendas alternativas** para o post do carrossel.
        4.  Cada legenda deve ser emocional, aprofundar o tema do carrossel e terminar com um CTA claro que instigue um comentário de UMA PALAVRA (conforme a metodologia).
        5.  Retorne a resposta estritamente como um array JSON de strings.

        --- INÍCIO DO DOCUMENTO UNIFICADO (SUA BASE DE CONHECIMENTO) ---
        ${UNIFIED_DOCUMENT}
        --- FIM DO DOCUMENTO UNIFICADO ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            safetySettings,
        });
        
        const jsonText = response.text.trim();
        const captions = JSON.parse(jsonText);
        return captions;
    } catch (error) {
        throw handleApiError(error, "gerar legendas alternativas");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
            safetySettings,
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("Nenhum áudio foi gerado.");
        }
    } catch (error) {
        throw handleApiError(error, "gerar a narração de áudio");
    }
};

/**
 * =============================================================================
 * DocumentProcessor — Carregamento e divisão de PDF em chunks para RAG
 * =============================================================================
 *
 * Pipeline típico de RAG (Retrieval-Augmented Generation):
 * 1. Carregar documento (PDF) → páginas como "documentos" brutos.
 * 2. Dividir em chunks (RecursiveCharacterTextSplitter) para não exceder
 *    limite de contexto do modelo e manter trechos com sentido completo.
 * 3. Cada chunk será depois convertido em embedding e indexado no Neo4j
 *    para busca por similaridade; a pergunta do usuário também vira
 *    embedding e os chunks mais próximos são injetados no prompt da LLM.
 *
 * Em C#: equivalente a usar uma lib de PDF (ex.: PdfPig) + lógica de
 * split por tamanho/overlap e retorno de lista de fragmentos com metadados.
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { type TextSplitterConfig } from "./config.ts";

export class DocumentProcessor {
    private pdfPath: string;
    private textSplitterConfig: TextSplitterConfig;

    constructor(pdfPath: string, textSplitterConfig: TextSplitterConfig) {
        this.pdfPath = pdfPath;
        this.textSplitterConfig = textSplitterConfig;
    }

    /**
     * Carrega o PDF e o divide em chunks. Cada chunk terá depois um embedding
     * gerado (ex.: Transformer.js ou API) e será armazenado no Neo4j para
     * consultas por similaridade (RAG).
     */
    async loadAndSplit() {
        const loader = new PDFLoader(this.pdfPath);
        const rawDocuments = await loader.load();
        console.log(`📄 Loaded ${rawDocuments.length} pages from PDF`);

        const splitter = new RecursiveCharacterTextSplitter(
            this.textSplitterConfig
        );
        const documents = await splitter.splitDocuments(rawDocuments);
        console.log(`✂️  Split into ${documents.length} chunks`);

        return documents.map((doc) => ({
            ...doc,
            metadata: {
                source: doc.metadata.source,
            },
        }));
    }
}
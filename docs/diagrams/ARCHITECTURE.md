# Architecture Diagrams — AI Interview Assistant

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph Client["🌐 Client (Browser)"]
        FE["Next.js 15\nReact 19"]
    end

    subgraph Backend["🖥️ Backend (NestJS)"]
        API["REST API\nv1"]
        AUTH["Auth Module\nJWT + RBAC"]
        RESUME["Resume Module\nPDF/DOCX Parser"]
        INTERVIEW["Interview Engine\nQuestion Generator"]
        EVAL["Evaluation Engine\nScoring + Feedback"]
        CHAT["Chat Module\nStreaming SSE"]
        RAG["RAG Module\nRetrieval Pipeline"]
        PROMPT["Prompt Manager\nTemplates + Versions"]
    end

    subgraph Infrastructure["🏗️ Infrastructure"]
        PG[("PostgreSQL 16\n+ pgvector")]
        REDIS[("Redis 7\nCache + Sessions")]
    end

    subgraph AILayer["🤖 AI Layer (Provider Pattern)"]
        LLM_IF["LLMProvider\ninterface"]
        EMBED_IF["EmbeddingProvider\ninterface"]
        
        subgraph Local["Local (Default)"]
            OLLAMA["Ollama\nllama3 / mistral"]
            NOMIC["nomic-embed-text"]
        end
        
        subgraph AWS["AWS (Optional)"]
            BEDROCK["Amazon Bedrock\nClaude / Nova"]
            TITAN["Titan Embeddings V2"]
        end
    end

    subgraph Storage["💾 Storage (Provider Pattern)"]
        LOCAL_STORE["Local Filesystem\n./uploads"]
        S3["Amazon S3\n(optional)"]
    end

    FE <-->|"HTTPS + SSE"| API
    API --> AUTH
    API --> RESUME
    API --> INTERVIEW
    API --> EVAL
    API --> CHAT
    API --> RAG
    API --> PROMPT

    AUTH --> PG
    AUTH --> REDIS
    RESUME --> PG
    CHAT --> LLM_IF
    RAG --> EMBED_IF
    RAG --> PG

    LLM_IF --> OLLAMA
    LLM_IF -.->|"AI_PROVIDER=bedrock"| BEDROCK
    EMBED_IF --> NOMIC
    EMBED_IF -.->|"EMBEDDING_PROVIDER=titan"| TITAN
    
    RESUME --> LOCAL_STORE
    RESUME -.->|"STORAGE_PROVIDER=s3"| S3
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as NestJS API
    participant DB as PostgreSQL
    participant R as Redis

    Note over C,R: Registration Flow
    C->>API: POST /auth/register { email, password }
    API->>API: Validate DTO (class-validator)
    API->>DB: Check email uniqueness
    DB-->>API: not found
    API->>API: bcrypt.hash(password, 12)
    API->>DB: INSERT user
    DB-->>API: user created
    API->>API: Sign access token (15min)
    API->>API: Sign refresh token (7d)
    API->>API: bcrypt.hash(refreshToken)
    API->>DB: UPDATE user.refreshTokenHash
    API->>R: SETEX refresh_token:{userId} 604800
    API-->>C: { user, tokens }

    Note over C,R: Token Refresh Flow
    C->>API: POST /auth/refresh { refreshToken }
    API->>API: Decode token (get userId)
    API->>DB: Fetch user.refreshTokenHash
    API->>API: bcrypt.compare(token, hash)
    API->>R: GET refresh_token:{userId}
    R-->>API: "1" (exists)
    API->>API: Sign new token pair
    API->>DB: UPDATE refreshTokenHash
    API->>R: SETEX new TTL
    API-->>C: { accessToken, refreshToken }
```

---

## 3. RAG (Retrieval-Augmented Generation) Flow

```mermaid
flowchart TD
    A[Upload Document\nPDF / DOCX] --> B[Text Extraction\npdf-parse / mammoth]
    B --> C{Chunking Strategy}
    C -->|"By paragraph\n~500 tokens"| D[Text Chunks]
    D --> E[EmbeddingProvider.embed]
    E -->|"Local"| F["Ollama\nnomic-embed-text\n768 dims"]
    E -->|"AWS Optional"| G["Titan Embeddings V2\n1536 dims"]
    F --> H[(pgvector\nEmbeddings table)]
    G --> H
    
    subgraph Retrieval["Query Time"]
        I[User Question] --> J[Embed Query]
        J --> K["pgvector cosine search\n<=> operator\ntop-k=5"]
        K --> L[(pgvector)]
        L --> M[Relevant Chunks]
        M --> N[Build Context Prompt]
        N --> O[LLMProvider.complete]
        O --> P[Answer + Citations]
    end
    
    H --> L
```

---

## 4. Database Schema

```mermaid
erDiagram
    User {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        string refreshTokenHash
        datetime createdAt
    }

    Resume {
        uuid id PK
        uuid userId FK
        string filename
        text extractedText
        enum status
        json metadata
    }

    JobDescription {
        uuid id PK
        uuid userId FK
        string title
        text extractedText
        string[] requirements
        string[] techStack
    }

    InterviewSession {
        uuid id PK
        uuid userId FK
        uuid resumeId FK
        enum type
        enum difficulty
        enum status
        int totalQuestions
    }

    Question {
        uuid id PK
        uuid sessionId FK
        enum category
        enum difficulty
        text content
        text expectedAnswer
    }

    Evaluation {
        uuid id PK
        uuid sessionId FK
        uuid questionId FK
        text userAnswer
        json scores
        text feedback
        string[] improvements
    }

    Conversation {
        uuid id PK
        uuid userId FK
        string model
        string provider
        int totalTokens
    }

    Message {
        uuid id PK
        uuid conversationId FK
        enum role
        text content
        int tokenCount
        int latencyMs
    }

    Embedding {
        uuid id PK
        enum sourceType
        uuid sourceId
        text content
        int chunkIndex
        vector vector
    }

    Prompt {
        uuid id PK
        string name
        int version
        text template
        string[] variables
        bool isActive
    }

    User ||--o{ Resume : "uploads"
    User ||--o{ JobDescription : "creates"
    User ||--o{ InterviewSession : "has"
    User ||--o{ Conversation : "starts"
    InterviewSession ||--o{ Question : "contains"
    InterviewSession ||--o{ Evaluation : "generates"
    Conversation ||--o{ Message : "has"
    Resume ||--o{ Embedding : "chunked into"
    JobDescription ||--o{ Embedding : "chunked into"
```

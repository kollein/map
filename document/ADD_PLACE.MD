```
Google Maps Parser (Crawler)
    ↓
Kafka Producer  --->  Kafka Cluster  --->  Kafka Consumer (Place Service)
                                      ↘️  Database (PostgreSQL + Prisma)
```

```
flowchart TD
    subgraph Producer
        A[Producer sends message] -->|Send message| B[Kafka Broker Leader]
    end

    subgraph KafkaCluster
        B -->|write to partition| C[Partition on Broker]
        C -->|replicate if multiple brokers| D[Replica on another Broker]
        C -->|deliver to consumer| E[Consumer Group]
    end

    subgraph Zookeeper
        Z[Zookeeper] -->|Manage broker alive/dead & leader election| B
        Z -->|Update partition metadata| D
    end

    classDef producer fill:#D6EAF8,stroke:#3498DB,stroke-width:1px;
    classDef broker fill:#FCF3CF,stroke:#F1C40F,stroke-width:1px;
    classDef consumer fill:#D5F5E3,stroke:#27AE60,stroke-width:1px;
    classDef zookeeper fill:#FADBD8,stroke:#E74C3C,stroke-width:1px;

    class A producer;
    class B,C,D broker;
    class E consumer;
    class Z zookeeper;
```

```
flowchart TD
    %% Producer
    P[Producer sends message] --> T[Topic: places]

    %% Consumer Group A
    subgraph "Consumer Group A"
        CA1[Consumer A1]
        CA2[Consumer A2]
        T -->|Partition P0 →| CA1
        T -->|Partition P1 →| CA2
        T -->|Partition P2 →| CA1
    end

    %% Consumer Group B
    subgraph "Consumer Group B"
        CB1[Consumer B1]
        CB2[Consumer B2]
        T -->|Partition P0 →| CB1
        T -->|Partition P1 →| CB2
        T -->|Partition P2 →| CB1
    end

    %% Styling
    classDef producer fill:#D6EAF8,stroke:#3498DB,stroke-width:1px;
    classDef topic fill:#FCF3CF,stroke:#F1C40F,stroke-width:1px;
    classDef consumer fill:#D5F5E3,stroke:#27AE60,stroke-width:1px;
    class P producer;
    class T topic;
    class CA1,CA2,CB1,CB2 consumer;
```

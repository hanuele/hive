# Squad Composition

Before assembling a team, the Orchestrator assesses the mission along four terrain axes. If two or more axes point toward a squad approach, the specific axis profile determines which squad type is most appropriate. When no template matches exactly, a tiebreaker rule applies precedence ordering to select the closest match.

```mermaid
flowchart TD
    START([New Mission]) --> A1

    subgraph ASSESS[Terrain Assessment]
        A1[Uncertainty\nHow well-defined\nis the problem?]
        A2[Reversibility\nCan mistakes\nbe undone?]
        A3[Breadth\nHow many domains\nare involved?]
        A4[Stakes\nWhat is the cost\nof failure?]
    end

    A1 & A2 & A3 & A4 --> COUNT{2+ axes\npoint to Squad?}
    COUNT -- No --> SOLO[Solo Agent\nUse single agent]
    COUNT -- Yes --> PROFILE[Determine terrain profile]

    PROFILE --> Q1{High\nUncertainty?}
    Q1 -- Yes --> RESEARCH[Research Squad\n3-4 agents\nOrchestrator + 2 Investigators\n+ optional Challenger]

    Q1 -- No --> Q2{Irreversible\nOR High Stakes?}
    Q2 -- Yes --> REVIEW[Review Squad\n3-4 agents\nOrchestrator + 2-3 Challengers\nwith complementary lenses]

    Q2 -- No --> Q3{Broad scope\nMedium stakes?}
    Q3 -- Yes --> FULL[Full Engineering Squad\n4-5 agents\nOrchestrator + Architect\n+ Operator + Tester\n+ optional Security]
    Q3 -- No --> FOCUSED[Focused Build Squad\n3 agents\nArchitect + Operator + Tester]

    PROFILE --> TIE{No exact\nmatch?}
    TIE -- Yes --> TIEBREAK[Tiebreaker Rule\nPrecedence:\nReversibility\nStakes\nUncertainty\nBreadth]
    TIEBREAK --> PROFILE
```

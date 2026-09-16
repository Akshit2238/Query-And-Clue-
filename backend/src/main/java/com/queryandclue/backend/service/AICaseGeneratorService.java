package com.queryandclue.backend.service;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import com.queryandclue.backend.generated.GeneratedCase;

import tools.jackson.databind.json.JsonMapper;

@Service
public class AICaseGeneratorService {

    private final Client client;
    private final JsonMapper jsonMapper;

    public AICaseGeneratorService(JsonMapper jsonMapper) {
        this.client = new Client();
        this.jsonMapper = jsonMapper;
    }

    public GeneratedCase generateCase() {

        String prompt = """
                Generate one completely original fictional detective case
                for a SQL-based investigation game called Query & Clue.

                Return JSON matching the provided response schema exactly.

                Rules:
                - Exactly 1 victim.
                - At least 4 suspects.
                - At least 1 crime scene.
                - At least 5 evidence records.
                - At least 6 timeline events.
                - Generate useful access logs.
                - Generate useful phone records.
                - Generate useful financial transactions.
                - Exactly 1 culprit.
                - The culprit must be one of the suspects.
                - All records must be logically consistent.
                - The case must be solvable using SQL queries.
                - Do not generate database IDs.
                - Do not use real people.
                - Do not use real criminal cases.
                - The solution must contain the culprit name,
                  motive, crime method, and explanation.
                - crimeDate and dateFound must use YYYY-MM-DD.
                - Date/time fields must use YYYY-MM-DDTHH:MM:SS.
                - Use the exact field names from the response schema.
                - Do not add extra fields.
                """;

        Schema caseSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "title", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "description", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "difficulty", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "crimeDate", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "crimeType", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "title",
                        "description",
                        "difficulty",
                        "crimeDate",
                        "crimeType"
                )
                .build();

        Schema victimSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "name", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "age", Schema.builder()
                                .type(Type.Known.INTEGER)
                                .build(),

                        "occupation", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "causeOfCrime", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "name",
                        "age",
                        "occupation",
                        "causeOfCrime"
                )
                .build();

        Schema suspectSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "name", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "age", Schema.builder()
                                .type(Type.Known.INTEGER)
                                .build(),

                        "occupation", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "relationshipToVictim", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "motive", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "alibi", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "name",
                        "age",
                        "occupation",
                        "relationshipToVictim",
                        "motive",
                        "alibi"
                )
                .build();

        Schema crimeSceneSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "name", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "location", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "description", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "name",
                        "location",
                        "description"
                )
                .build();

        Schema evidenceSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "description", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "location", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "evidenceType", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "dateFound", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "description",
                        "location",
                        "evidenceType",
                        "dateFound"
                )
                .build();

        Schema timelineSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "eventTime", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "description", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "eventTime",
                        "description"
                )
                .build();

        Schema accessLogSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "suspectName", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "location", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "accessTime", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "exitTime", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "suspectName",
                        "location",
                        "accessTime",
                        "exitTime"
                )
                .build();

        Schema phoneRecordSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "callerSuspectName", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "receiverSuspectName", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "callTime", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "callDuration", Schema.builder()
                                .type(Type.Known.INTEGER)
                                .build()
                ))
                .required(
                        "callerSuspectName",
                        "receiverSuspectName",
                        "callTime",
                        "callDuration"
                )
                .build();

        Schema transactionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "suspectName", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "amount", Schema.builder()
                                .type(Type.Known.NUMBER)
                                .build(),

                        "transactionDate", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "description", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "suspectName",
                        "amount",
                        "transactionDate",
                        "description"
                )
                .build();

        Schema solutionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "culpritSuspectName", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "motive", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "crimeMethod", Schema.builder()
                                .type(Type.Known.STRING)
                                .build(),

                        "explanation", Schema.builder()
                                .type(Type.Known.STRING)
                                .build()
                ))
                .required(
                        "culpritSuspectName",
                        "motive",
                        "crimeMethod",
                        "explanation"
                )
                .build();

        Schema fullSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "case", caseSchema,

                        "victim", victimSchema,

                        "suspects", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(suspectSchema)
                                .build(),

                        "crimeScenes", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(crimeSceneSchema)
                                .build(),

                        "evidence", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(evidenceSchema)
                                .build(),

                        "timelineEvents", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(timelineSchema)
                                .build(),

                        "accessLogs", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(accessLogSchema)
                                .build(),

                        "phoneRecords", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(phoneRecordSchema)
                                .build(),

                        "transactions", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(transactionSchema)
                                .build(),

                        "solution", solutionSchema
                ))
                .required(
                        "case",
                        "victim",
                        "suspects",
                        "crimeScenes",
                        "evidence",
                        "timelineEvents",
                        "accessLogs",
                        "phoneRecords",
                        "transactions",
                        "solution"
                )
                .build();

        GenerateContentConfig config =
                GenerateContentConfig.builder()
                        .responseMimeType("application/json")
                        .responseSchema(fullSchema)
                        .build();

        GenerateContentResponse response =
                client.models.generateContent(
                        "gemini-3.6-flash",
                        prompt,
                        config
                );

        String json = response.text();

        if (json == null || json.isBlank()) {
            throw new RuntimeException("Gemini returned empty JSON");
        }

        try {
            return jsonMapper.readValue(json, GeneratedCase.class);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Could not convert Gemini JSON to GeneratedCase",
                    e
            );
        }
    }
}
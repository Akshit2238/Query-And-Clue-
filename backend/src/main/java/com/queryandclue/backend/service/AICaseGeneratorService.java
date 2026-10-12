package com.queryandclue.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.queryandclue.backend.generated.GeneratedCase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AICaseGeneratorService {

    private static final List<String> THEMES = List.of(
        "a murder at a Victorian-era mansion during a dinner party",
        "a poisoning inside a luxury cruise ship",
        "a theft and blackmail scheme at a prestigious art auction house",
        "a disappearance in a small mountain village with a dark secret",
        "a sabotage at a prestigious horse racing event",
        "a heist gone wrong at an underground casino",
        "a murder backstage at a famous theatre on opening night",
        "a kidnapping linked to an old family inheritance dispute",
        "a poisoning at a high-stakes cooking competition",
        "a murder inside a university library during exam season",
        "a conspiracy at a remote research station in the mountains",
        "a blackmail ring exposed at an exclusive private members club",
        "a murder during a masquerade ball at a haunted estate",
        "a smuggling operation uncovered at a coastal fishing village",
        "a corporate espionage case at a pharmaceutical company",
        "a murder at a championship chess tournament",
        "a suspicious death at an ancient monastery",
        "a fraud scheme at an antique shop with forged historical items",
        "a murder at a wine vineyard during harvest festival",
        "a missing persons case tied to an underground fight club"
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Random random = new Random();

    public AICaseGeneratorService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public GeneratedCase generateCase() {

        String apiKey = System.getenv("GROQ_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException(
                    "GROQ_API_KEY environment variable is not set"
            );
        }

        String theme = THEMES.get(random.nextInt(THEMES.size()));

        String prompt = """
                Generate exactly ONE original fictional detective case for an SQL investigation game.

                THEME: The case is set around %s.
                You MUST use this exact setting and scenario. Do NOT default to tech companies or data breaches.
                Invent completely new fictional character names, locations, and a unique storyline.

                The case must be logically consistent, solvable, and fictional.

                EXACT DATA COUNTS:""".formatted(theme) + """
                - 1 victim
                - exactly 4 suspects
                - exactly 1 crime scene
                - exactly 5 evidence records
                - exactly 6 timeline events
                - exactly 4 access logs
                - exactly 4 phone records
                - exactly 4 transactions
                - exactly 1 solution

                IMPORTANT REFERENCE RULES:

                1. There are exactly 4 suspects.
                2. Every accessLog.suspectName MUST exactly match one of the 4 suspect names.
                3. Every transaction.suspectName MUST exactly match one of the 4 suspect names.
                4. Every phoneRecord.callerSuspectName MUST exactly match one of the 4 suspect names.
                5. Every phoneRecord.receiverSuspectName MUST exactly match one of the 4 suspect names.
                6. Do NOT use names such as "Unknown", "Unknown Rival", "Developer Partner", "Anonymous", or any person who is not a suspect.
                7. solution.culpritSuspectName MUST exactly match one of the 4 suspect names.
                8. The culprit must be one of the suspects.
                9. All records must belong logically to the same case.
                10. The evidence, timeline, access logs, phone records, and transactions must provide enough information to solve the case using SQL queries.

                CONTENT RULES:

                - Use fictional people and locations only.
                - Do not use real crimes or real people.
                - Keep descriptions concise.
                - Use plain ASCII characters only.
                - Do not use em dashes, en dashes, smart quotes, currency symbols, or unusual Unicode characters.
                - Use dates in YYYY-MM-DD format.
                - Use date-times in YYYY-MM-DDTHH:MM:SS format.
                - Use positive numbers for ages, amounts, and call durations.
                - Do not add database IDs.
                - Do not add fields that are not in the required schema.
                - The final solution must identify the culprit, motive, crime method, and explain how the clues prove it.

                Make the mystery interesting but keep the generated data compact.
                Return ONLY the structured data required by the JSON schema.
                """;

        String requestBody = buildRequestBody(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .timeout(Duration.ofMinutes(2))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {

                throw new RuntimeException(
                        "Groq API error "
                                + response.statusCode()
                                + ": "
                                + response.body()
                );
            }

            JsonNode root = objectMapper.readTree(response.body());

            JsonNode choices = root.get("choices");

            if (choices == null || !choices.isArray() || choices.isEmpty()) {
                throw new RuntimeException(
                        "Groq response did not contain choices"
                );
            }

            JsonNode message = choices.get(0).get("message");

            if (message == null) {
                throw new RuntimeException(
                        "Groq response did not contain message"
                );
            }

            JsonNode contentNode = message.get("content");

            if (contentNode == null || contentNode.isNull()) {
                throw new RuntimeException(
                        "Groq response did not contain generated content"
                );
            }

            String json = contentNode.textValue();

            if (json == null || json.isBlank()) {
                throw new RuntimeException(
                        "Groq returned empty generated content"
                );
            }

            return objectMapper.readValue(
                    json,
                    GeneratedCase.class
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Groq request was interrupted",
                    e
            );

        } catch (Exception e) {

            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }

            throw new RuntimeException(
                    "Could not generate detective case using Groq",
                    e
            );
        }
    }

    private String buildRequestBody(String prompt) {

        return """
                {
                  "model": "openai/gpt-oss-120b",
                  "messages": [
                    {
                      "role": "user",
                      "content": %s
                    }
                  ],
                  "temperature": 1.0,
                  "max_completion_tokens": 8192,
                  "reasoning_effort": "low",
                  "include_reasoning": false,
                  "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                      "name": "detective_case",
                      "strict": true,
                      "schema": {
                        "type": "object",
                        "additionalProperties": false,
                        "required": [
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
                        ],
                        "properties": {

                          "case": {
                            "type": "object",
                            "additionalProperties": false,
                            "required": [
                              "title",
                              "description",
                              "difficulty",
                              "crimeDate",
                              "crimeType"
                            ],
                            "properties": {
                              "title": {
                                "type": "string"
                              },
                              "description": {
                                "type": "string"
                              },
                              "difficulty": {
                                "type": "string"
                              },
                              "crimeDate": {
                                "type": "string"
                              },
                              "crimeType": {
                                "type": "string"
                              }
                            }
                          },

                          "victim": {
                            "type": "object",
                            "additionalProperties": false,
                            "required": [
                              "name",
                              "age",
                              "occupation",
                              "causeOfCrime"
                            ],
                            "properties": {
                              "name": {
                                "type": "string"
                              },
                              "age": {
                                "type": "integer"
                              },
                              "occupation": {
                                "type": "string"
                              },
                              "causeOfCrime": {
                                "type": "string"
                              }
                            }
                          },

                          "suspects": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "name",
                                "age",
                                "occupation",
                                "relationshipToVictim",
                                "motive",
                                "alibi"
                              ],
                              "properties": {
                                "name": {
                                  "type": "string"
                                },
                                "age": {
                                  "type": "integer"
                                },
                                "occupation": {
                                  "type": "string"
                                },
                                "relationshipToVictim": {
                                  "type": "string"
                                },
                                "motive": {
                                  "type": "string"
                                },
                                "alibi": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "crimeScenes": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "name",
                                "location",
                                "description"
                              ],
                              "properties": {
                                "name": {
                                  "type": "string"
                                },
                                "location": {
                                  "type": "string"
                                },
                                "description": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "evidence": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "description",
                                "location",
                                "evidenceType",
                                "dateFound"
                              ],
                              "properties": {
                                "description": {
                                  "type": "string"
                                },
                                "location": {
                                  "type": "string"
                                },
                                "evidenceType": {
                                  "type": "string"
                                },
                                "dateFound": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "timelineEvents": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "eventTime",
                                "description"
                              ],
                              "properties": {
                                "eventTime": {
                                  "type": "string"
                                },
                                "description": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "accessLogs": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "suspectName",
                                "location",
                                "accessTime",
                                "exitTime"
                              ],
                              "properties": {
                                "suspectName": {
                                  "type": "string"
                                },
                                "location": {
                                  "type": "string"
                                },
                                "accessTime": {
                                  "type": "string"
                                },
                                "exitTime": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "phoneRecords": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "callerSuspectName",
                                "receiverSuspectName",
                                "callTime",
                                "callDuration"
                              ],
                              "properties": {
                                "callerSuspectName": {
                                  "type": "string"
                                },
                                "receiverSuspectName": {
                                  "type": "string"
                                },
                                "callTime": {
                                  "type": "string"
                                },
                                "callDuration": {
                                  "type": "integer"
                                }
                              }
                            }
                          },

                          "transactions": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "additionalProperties": false,
                              "required": [
                                "suspectName",
                                "amount",
                                "transactionDate",
                                "description"
                              ],
                              "properties": {
                                "suspectName": {
                                  "type": "string"
                                },
                                "amount": {
                                  "type": "number"
                                },
                                "transactionDate": {
                                  "type": "string"
                                },
                                "description": {
                                  "type": "string"
                                }
                              }
                            }
                          },

                          "solution": {
                            "type": "object",
                            "additionalProperties": false,
                            "required": [
                              "culpritSuspectName",
                              "motive",
                              "crimeMethod",
                              "explanation"
                            ],
                            "properties": {
                              "culpritSuspectName": {
                                "type": "string"
                              },
                              "motive": {
                                "type": "string"
                              },
                              "crimeMethod": {
                                "type": "string"
                              },
                              "explanation": {
                                "type": "string"
                              }
                            }
                          }

                        }
                      }
                    }
                  }
                }
                """.formatted(
                formatPrompt(prompt)
        );
    }

    private String formatPrompt(String prompt) {
        try {
            return objectMapper.writeValueAsString(prompt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize prompt", e);
        }
    }
}
INSERT INTO cases
(title, description, difficulty, crime_date, crime_type)
VALUES
(
    'The Midnight Ledger',
    'A valuable ledger disappeared from a locked office.',
    'Easy',
    '2026-09-10',
    'Theft'
);

INSERT INTO suspects
    (case_id, name, age, occupation, relationship_to_victim, motive, alibi)
VALUES
    (1, 'Daniel Carter', 34, 'Accountant',
     'Colleague', 'Wanted to hide financial fraud',
     'Claims he was working late at the office'),

    (1, 'Rebecca Moore', 29, 'Legal Advisor',
     'Friend', 'Had a dispute with the victim over money',
     'Claims she left the building at 8:30 PM'),

    (1, 'Michael Bennett', 41, 'Security Manager',
     'Employee', 'Was angry about being blamed for previous security failures',
     'Claims he was checking security cameras'),

    (1, 'Olivia Parker', 36, 'Business Partner',
     'Business Partner', 'Feared the victim would expose her financial dealings',
     'Claims she was at a nearby restaurant');
     
     INSERT INTO case_solutions
    (case_id, culprit_suspect_id, motive, crime_method, explanation)
VALUES
    (1, 1,
     'Wanted to hide financial fraud',
     'Used access to the office to steal the ledger',
     'Daniel used his access to enter the office, remove the ledger, and attempt to conceal evidence of financial fraud.');


INSERT INTO victims
    (case_id, name, age, occupation, cause_of_crime)
VALUES
    (1, 'Sarah Morgan', 34, 'Financial Director',
     'Blunt force trauma');
     
     INSERT INTO crime_scenes
    (case_id, name, location, description)
VALUES
    (1, 'Executive Office', 'Morgan Financial Tower - Floor 7',
     'The victim was found inside her locked office.');
     
     INSERT INTO evidence
    (case_id, description, location, evidence_type, date_found)
VALUES
    (1, 'Broken desk drawer containing financial documents',
     'Executive Office', 'Physical', '2026-09-10'),

    (1, 'Security card belonging to Daniel Carter',
     'Executive Office', 'Access Card', '2026-09-10'),

    (1, 'Handwritten financial ledger',
     'Executive Office', 'Document', '2026-09-10'),

    (1, 'Partial fingerprint found on the desk drawer',
     'Executive Office', 'Fingerprint', '2026-09-10'),

    (1, 'Security camera footage showing an unidentified person entering the office',
     'Security Room', 'Video', '2026-09-10');
     
     INSERT INTO timeline_events
    (case_id, event_time, description)
VALUES
    (1, '2026-09-10 20:00:00',
     'Sarah Morgan begins working in the executive office.'),

    (1, '2026-09-10 20:30:00',
     'Rebecca Moore leaves the building.'),

    (1, '2026-09-10 20:45:00',
     'Michael Bennett begins checking the security system.'),

    (1, '2026-09-10 21:00:00',
     'Daniel Carter enters the seventh floor.'),

    (1, '2026-09-10 21:20:00',
     'Daniel Carter enters the executive office.'),

    (1, '2026-09-10 21:30:00',
     'Sarah Morgan is attacked.'),

    (1, '2026-09-10 21:40:00',
     'Daniel Carter leaves the seventh floor.'),

    (1, '2026-09-10 22:00:00',
     'The victim is discovered by security staff.');
     
     
     INSERT INTO access_logs
    (suspect_id, case_id, location, access_time, exit_time)
VALUES
    (1, 1, 'Executive Office', '2026-09-10 21:20:00',
        '2026-09-10 21:40:00'),

    (2, 1, 'Main Building', '2026-09-10 19:00:00',
        '2026-09-10 20:30:00'),

    (3, 1, 'Security Room', '2026-09-10 20:45:00',
        '2026-09-10 22:00:00'),

    (4, 1, 'Main Building', '2026-09-10 18:30:00',
        '2026-09-10 20:15:00');
        
        INSERT INTO phone_records
    (case_id, caller_suspect_id, receiver_suspect_id, call_time, call_duration)
VALUES
    (1, 1, 4, '2026-09-10 20:50:00', 180),

    (1, 2, 3, '2026-09-10 20:35:00', 240),

    (1, 3, 1, '2026-09-10 21:45:00', 120);
    
    INSERT INTO transactions
    (case_id, suspect_id, amount, transaction_date, description)
VALUES
    (1, 1, 15000.00, '2026-09-08 14:30:00',
     'Payment received from unknown account'),

    (1, 4, 5000.00, '2026-09-09 11:20:00',
     'Business expense reimbursement'),

    (1, 2, 1200.00, '2026-09-10 17:45:00',
     'Legal consultation payment');
     
     
     
SELECT * FROM cases;
SELECT * FROM victims;
SELECT * FROM suspects;
SELECT * FROM crime_scenes;
SELECT * FROM evidence;
SELECT * FROM timeline_events;
SELECT * FROM access_logs;
SELECT * FROM phone_records;
SELECT * FROM transactions;
SELECT * FROM case_solutions;
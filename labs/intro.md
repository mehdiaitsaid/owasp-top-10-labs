---
id: intro
title: Introduction
sidebar_position: 1
---

# 🔐 Introduction

## What is OWASP?

The **Open Worldwide Application Security Project (OWASP)** is a nonprofit foundation dedicated to improving the security of software.  
It provides **free tools, resources, and educational materials** to help developers, organizations, and security professionals build secure applications.

OWASP is best known for the **OWASP Top 10**, which highlights the **most critical web application security risks**.  
It serves as a widely adopted **standard of awareness** in the field of application security.

---

## 🎯 The OWASP Top 10 (2021 Edition)

Below is the list of the **OWASP Top 10 Web Application Security Risks** with short descriptions:

1. **Broken Access Control**
    - Failures that allow users to act outside of their intended permissions.
    - Example: Accessing another user’s account or sensitive data.

2. **Cryptographic Failures**
    - Issues related to weak or missing encryption and improper handling of sensitive data.
    - Example: Storing passwords in plain text.

3. **Injection**
    - Untrusted input is sent to an interpreter and executed as a command.
    - Example: SQL Injection, NoSQL Injection, Command Injection.

4. **Insecure Design**
    - Security flaws in the design or architecture of an application.
    - Example: Missing threat modeling or insecure business logic.

5. **Security Misconfiguration**
    - Insecure default settings, incomplete configurations, or open cloud storage.
    - Example: Debug mode enabled in production.

6. **Vulnerable and Outdated Components**
    - Using components with known vulnerabilities.
    - Example: Running an old framework version with unpatched CVEs.

7. **Identification and Authentication Failures**
    - Weak authentication or session management.
    - Example: Poor password policies, session hijacking.

8. **Software and Data Integrity Failures**
    - Code and infrastructure that doesn’t protect against integrity violations.
    - Example: Downloading and running code from an untrusted source.

9. **Security Logging and Monitoring Failures**
    - Insufficient logging and alerting, allowing attackers to hide their actions.
    - Example: Breaches that go undetected for months.

10. **Server-Side Request Forgery (SSRF)**
    - An attacker tricks the server into making unauthorized requests.
    - Example: Accessing internal services or cloud metadata.

---

## 📌 Course Context

This lab environment, prepared by **Pr. AIT SAID Mehdi**, provides **hands-on exercises** for each of these risks.  
You will learn to:

- Understand how each vulnerability works
- Practice exploiting it in a **controlled environment**
- Apply **secure coding and mitigation strategies**

---

⚠️ **Disclaimer:**  
These labs are for **educational purposes only**.  
They must not be used to attack real-world applications or systems you don’t own or have explicit permission to test.  

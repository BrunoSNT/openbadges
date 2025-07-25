# Open Badges Specification

## Abstract

This specification is a new version of the [1EdTech Open Badges Specification](https://www.imsglobal.org/activity/digital-badges) that aligns with the conventions of the [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/) for the use cases of Defined Achievement Claim and a Skill Claim. The credentials that are produced are easily be bundled into Comprehensive Learner Records and Verifiable Presentations. Portability and learner data privacy are improved by expanding the usage of cryptographic proofs/signatures, because this format will be compatible with a growing array of proof schemas that are developed for the Verifiable Credentials Data Model.

## 1. Introduction

### 1.1 Audiences
The target readers for this document are:
- Business Leaders - the people who are responsible for identifying the business case for using verifiable digital credentials and badges
- Solution Architects - the people who are responsible for the definition and design of systems, applications, and tools that are to be used to issue, exchange, and verify digital credentials and badges
- Product Developers - the people who are adding functionality to issue, exchange, and verify digital credentials

### 1.2 Document Set
The Open Badges Specification has several related documents and artifacts shown below. Together they make up the specification.
- Open Badges Specification v3.0 ([OB-30]) - The main Open Badges Specification document.
- Open Badges Implementation Guide v3.0 ([OB-IMPL-30]) - Provides information to lead you to successful implementation and certification of the Open Badges 3.0 specification.
- Open Badges Specification Conformance and Certification Guide v3.0 ([OB-CERT-30]) - Specifies the conformance tests and certification requirements for this specification.

[OB-30]: https://www.imsglobal.org/spec/ob/v3p0/
[OB-IMPL-30]: https://www.imsglobal.org/spec/ob/v3p0/impl/
[OB-CERT-30]: https://www.imsglobal.org/spec/ob/v3p0/cert/

#### 1.2.1 OpenAPI 3.0 Files
The Open API Specification (OAS) defines a standard, programming language-agnostic interface description for HTTP APIs, which allows both humans and computers to discover and understand the capabilities of a service without requiring access to source code, additional documentation, or inspection of network traffic. When properly defined via OpenAPI, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interface descriptions have done for lower-level programming, the OpenAPI Specification removes guesswork in calling a service.
-- [OpenAPI Specification](https://www.openapis.org/)
- [JSON OpenAPI File](https://purl.imsglobal.org/spec/ob/v3p0/schema/openapi/ob_v3p0_oas.json)
- [YAML OpenAPI File](https://purl.imsglobal.org/spec/ob/v3p0/schema/openapi/ob_v3p0_oas.yaml)

#### 1.2.2 JSON-LD Context File
When two people communicate with one another, the conversation takes place in a shared environment, typically called "the context of the conversation". This shared context allows the individuals to use shortcut terms, like the first name of a mutual friend, to communicate more quickly but without losing accuracy. A context in JSON-LD works in the same way. It allows two applications to use shortcut terms to communicate with one another more efficiently, but without losing accuracy.
Simply speaking, a context is used to map terms to IRIs. Terms are case sensitive and any valid string that is not a reserved JSON-LD keyword can be used as a term.
-- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
- [https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json](https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json)

#### 1.2.3 JSON Schema
All JSON Schema can be found in § E.2 JSON Schema. JSON Schema files for credential and API schema verification are available online:
- [AchievementCredential JSON schema](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json)
- [EndorsementCredential JSON schema](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_endorsementcredential_schema.json)
- [GetOpenBadgeCredentialsResponse JSON schema](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_getopenbadgecredentialsresponse_schema.json)
- [Profile JSON schema](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_profile_schema.json)
- [Imsx_StatusInfo JSON schema](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_imsx_statusinfo_schema.json)
- [AchievementCredential JSON schema (Verifiable Credential Data Model v1.1 compatible)](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_anyachievementcredential_schema.json)
- [EndorsementCredential JSON schema (Verifiable Credential Data Model v1.1 compatible)](https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_anyendorsementcredential_schema.json)

### 1.3 Conformance Statements
As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative. Everything else in this specification is normative.
The key words MAY, MUST, MUST NOT, NOT RECOMMENDED, NOT REQUIRED, OPTIONAL, RECOMMENDED, REQUIRED, SHALL, SHALL NOT, SHOULD, and SHOULD NOT in this document are to be interpreted as described in [RFC2119].
An implementation of this specification that fails to implement a MUST/REQUIRED/SHALL requirement or fails to abide by a MUST NOT/SHALL NOT prohibition is considered nonconformant. SHOULD/SHOULD NOT/RECOMMENDED statements constitute a best practice. Ignoring a best practice does not violate conformance but a decision to disregard such guidance should be carefully considered. MAY/OPTIONAL statements indicate that implementers are entirely free to choose whether or not to implement the option.
The Conformance and Certification Guide for this specification may introduce greater normative constraints than those defined here for specific service or implementation categories.

### 1.4 Terminology
- **Achievement**: This is the content description of a credential that an assertion references. It contains metadata such as the name of the achievement, description, alignment of skills, etc. An Assertion asserts a single achievement. A CLR asserts a collection of assertions, each of which asserts a single achievement.
- **Achievement Type**: A vocabulary which describes the type of achievement.
- **Alignment**: An alignment is a reference to an achievement definition, whether referenced in a resource outside the package or contained within the package.
- **Assertion**: The core of both Open Badges and CLR is the assertion about achievement(s). Assertion properties are specific to one learner's achievement and specify metadata such as issuer, date of achievement, expiration data, as well as results and evidence that support the assertion. A Verifiable Credential more broadly asserts a claim about a Credential Subject which can be applied to education and occupational achievements.
- **Badge**: A single assertion of an achievement that is packaged as a verifiable credential.
- **Claim**: A statement about the Credential Subject. A claim may include associated evidence, results, or other metadata regarding a specific achievement, skill or assertion.
- **client**: In a REST API, the client is the actor that initiates the DELETE, GET, or POST request. Also called a Consumer in the [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/).
- **Comprehensive Learner Record (CLR)**: Set of assertions that can be packaged as a verifiable credential.
- **Credential**: A set of one or more claims made by an issuer. A verifiable credential is a tamper-evident credential that has authorship that can be cryptographically verified. Verifiable credentials can be used to build verifiable presentations, which can also be cryptographically verified.
- **Credential Subject**: Describes the claims being made by the Verifiable Credential. In the context of Open Badges and CLR is typically an individual but in the case of Open Badges, may be another entity type such as a course, book, or organization. Learners, Organizations and other entities can be explicit subclasses of Credential Subjects for purposes of business rules. [vc-data-model-2.0]
- **Decentralized Identifiers**: A type of identifier for people, organizations and any other entity, where each identifier is controlled independently of centralized registries. [did-core] [did-use-cases]
- **Defined Achievement Claim**: An assertion that the learner achieved a specific achievement.
- **DID URL**: A DID plus any additional syntactic component that conforms to the definition in Section 3.2 DID URL Syntax of [DID-CORE]. This includes an optional DID path (with its leading / character), optional DID query (with its leading ? character), and optional DID fragment (with its leading # character).
- **Evidence**: Information supporting a claim such as a URL to an artifact produced by the Learner.
- **Issuer**: The organization or entity that has made an assertion about a Credential Subject. The issuer of a DC Assertion is the authoritative source for that specific assertion.
- **Learner**: The person who is the subject of the CLR and assertions contained in a CLR.
- **Linked Data Proof**: A type of embedded signature proof.
- **Organization**: An organized group of one or more people with a particular purpose. [CEDS]
- **Person**: A human being, alive or deceased, as recognized by each jurisdiction’s legal definitions. [CEDS]
- **Presentation**: Data derived from one or more verifiable credentials, issued by one or more issuers, that is shared with a specific verifier. A verifiable presentation is a tamper-evident presentation encoded in such a way that authorship of the data can be trusted after a process of cryptographic verification.
- **Publisher**: The organization or entity issuing the CLR (typically the educational institution or a 3rd-party agent). The publisher is either the issuer or has a trusted relationship with the issuer of all the assertions in the CLR.
- **Relying Third-Party**: Also referred to as the "verifier" of a VC. This entity requests, verifies, and may consume data being presented.
- **REST API**: A style of web API (Application Programming Interface) loosely based on HTTP methods (DELETE, GET, POST, and PUT) to access resources (e.g. CLRs) via a URL.
- **Result**: Describes a possible achievement result. A result may contain the rubric level that was achieved.
- **Result Description**: Describes a possible achievement result. A result description may contain a rubric.
- **Rich Skill Descriptor (RSD)**: A machine readable reference to a description of a skill located at a unique URL. [RSD]
- **Role**: People have roles in organizations for specific periods of time. Roles are a time aware association between a person and an organization. [CEDS]
- **Rubric**: Defines levels associated with the achievement definition (e.g. "approaches", "meets", and "exceeds").
- **server**: In a REST API, the server is the actor that responds to a DELETE, GET, or POST request. Also called a Platform in the [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/).
- **Skill**: Measurable or observable knowledge, skill, or ability necessary to successful performance of a person.
- **Skill Assertion**: An assertion that contains a "skill result."
- **Skill Claim**: An assertion that the learner has the specified skill.
- **Subject**: A person about which claims are made.
- **Validation**: The process of assuring the verifiable credential or verifiable presentation meets the needs of the verifier and other dependent stakeholders. Validating verifiable credentials or verifiable presentations is outside the scope of this specification.
- **Verifiable Credential (VC)**: A tamper-evident credential whose issuer can be cryptographically verified. See [vc-data-model-2.0].
- **Verifiable Presentation (VP)**: A tamper-evident presentation of one or more Verifiable Credentials of which cryptographic verification can be used to determine the trustworthiness of the authorship of the data. [vc-data-model-2.0]
- **Verification**: The evaluation of whether a verifiable credential or verifiable presentation is an authentic and timely statement of the issuer or presenter, respectively. This includes checking that: the credential (or presentation) conforms to the specification; the proof method is satisfied; and, if present, the status check succeeds.
- **Verifier**: The entity that receives a verifiable credential or verifiable presentation and verifies the credential or presentation has not been tampered with.

### 1.5 Conceptual Model
This conceptual model describes Open Badges concepts and the relationship between those concepts. The data model in appendix § B.1 Credential Data Models below is the normative reference for the classes and properties that are used to implement the concepts.
The conceptual model is targeted for all § 1.1 Audiences, while the data model is targeted for Solution Architects and Product Developers.
In the diagram below, the concepts are shown in gray boxes (e.g. Assertion). Please see § 1.4 Terminology for definitions of the concepts.
Starting with this version of the Open Badges Specification, an Assertion is also a Verifiable Credential (VC) as defined by the [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/) specification. The diagram includes labels that show the relationships between VC terminology and Open Badges terminology (e.g. Issuer is identified by the VC "issuer").

*I, issuer assert a claim about this Credential Subject that may describe an achievement, experience, membership, etc.,*

- The assertion provides the identity of the issuer, issuance date, and instructions on how to cryptographically prove the issuer identity and that the assertion and claim contents have not been tampered with since issuance.
- The claim must contain a single Credential Subject which identifies the recipient of the Open Badge.
- The claim may also contain: evidence of the achievement, and other properties supporting the achievement description.
- The Achievement description is described using properties that may be shared with the CLR including, name, description, criteria, etc.

## 2. Overview

This section is non-normative.

### 2.1 What is the problem this solves for?
Verifiable Credentials (VCs) are a format that is used to publish a limitless variety of claims about a subject person or other entity, typically through a cryptographic proof. VCs can be collected and delivered as part of a presentation whereby authorship of each VC from the same or multiple issuers can be trusted via cryptographic verification.
These layers of cryptographic proof can provide security and privacy enhancements to Open Badges that were not available in version 2.0. Adoption of Verifiable Credentials will increase market penetration and use of Open Badges by addressing market needs for trustworthy machine-ready data to power connected ecosystems in education and workforce. This will unlock the door for Open Badges credentials to be included in a growing number of multi-purpose digital credential wallets entering the market. Stepping further into signed VCs and another associated technology, [Decentralized Identifiers (DIDs) v1.0](https://www.w3.org/TR/did-core/), unlocks increased longevity and resilience of Open Badges that can describe achievements even more expressively than they do today.

### 2.2 What does adopting Verifiable Credentials entail?
This specification changes the structure of the Open Badges Assertion class, to adopt the conventions of the [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/). This means that badges issued under this specification will not be conformant to all of the existing 2.x data model requirements.
Previous versions of an Open Badges Assertion, illustrated in the graphic below, structures its objects like this: An Assertion identifies a recipient with a "recipient" relationship to an IdentityObject that contains identifying properties. It identifies which badge it represents with a "badge" relationship to a BadgeClass. It identifies its verification information with a "verification" relationship to a VerificationObject. It identifies its issuer with an "issuer" relationship between the BadgeClass and the Issuer.
The Verifiable Credentials structure in this specification depicted below offers the same information with a slightly different structure: A Verifiable Credential identifies its recipient with a "credentialSubject" relationship to a subject class that is identified by an identifier. It identifies its issuer with an "issuer" relationship directly to an Issuer. The Credential claims the subject has met the criteria of a specific Achievement (also known as the BadgeClass in previous versions) with an "achievement" relationship to that defined achievement. And it identifies its verification information with a proof.

### 2.3 Benefits and Opportunities
It can be risky to make breaking changes to a specification used as broadly as Open Badges, but there are a range of benefits to making this move now while the Verifiable Credentials ecosystem is young and growing fast. There are strong use cases for digital credentials for learning and skill achievements across the nexus of education and employment, as we have seen from the broad adoption of Open Badges and the proliferation of industry groups making connections between educational institutions and the employment market around digital credentials. Technical compatibility is in a more favorable position when faced with rapid ecosystem growth than competition between large communities issuing these learning credentials and other communities focused on different market verticals from government identity documents, commercial payments, and international trade, to name a few.
This specification opens a path forward for a unified concept of digital credentials in the 1EdTech community, collapsing the relevant differences between Open Badges and Comprehensive Learner Record (CLR), and addressing a clear set of single achievement use cases with a robust, flexible, and future-proof solution that can easily be integrated with the set-of-multiple credentials use cases familiar to CLR.
Below, we present a selection of benefits related to this restructuring of Open Badges, and compare the opportunities opened by becoming compatible with Verifiable Credentials to the limitations that the Open Badges community has encountered with previous versions of Open Badges and CLR.

#### 2.3.1 Interoperability with Digital Wallets, Verifiable Presentations, and Learner Experiences
Open Badges as VCs are designed to be issued and offered to learners who may accept them into their digital wallet. Wallets are software that runs on either the web or as a native app on a mobile device or desktop environment. A web wallet is another term to describe the application role known under [OB-20] as a "Host". There is an existing and growing ecosystem of deployed technology to support VCs; integration with these becomes possible with this specification. For example, a number of generic Verifiable Credential wallet implementations are available from a variety of vendors as native mobile apps. From a wallet, recipients may package their badges along with their other VCs into verifiable presentations. A presentation contains the credentials that the learner wishes to share with a relying party. The digital wallet application digitally signs the presentation using the key of the learner. The verifying third-parties can cryptographically verify that the presentation came unmodified directly from the credential holder as well as the integrity of each of the VCs included in the presentation as credentials signed by each of their respective issuers.
It is possible from a wallet to package credentials into a verifiable presentation in response to a request from a relying party who seeks credentials for a certain purpose. For example, a potential employer seeking to fill an internship role, may need to verify that a student is over 18, has completed a course on communication, and is a current student. A student could use their wallet to package three VCs (driver's license, course completion badge, and student ID) into a presentation that is signed by their private key. When the presentation is sent to the employer's website, the employer can verify that the VCs belong to the student and that the VCs are authentic.
The growing collection of VC wallets is an example of how adopting a Verifiable Credentials-based approach allows Open Badges to grow in impact and take advantage of existing momentum in the digital credentials space around tooling that is entering the market and heading towards maturity.

#### 2.3.2 Verifiable Credentials Support Increases Learner Data Privacy and Trustworthiness of Open Badges
The Verifiable Credentials Data Model v2.0 specification describes how technologies can be used to present cryptographically verifiable and tamper-evident claims. Verifiable Credentials (VCs) can be verified through up-to-date and broadly interoperable schemas for verification. This can provide security and privacy enhancements to [1EdTech Open Badges](https://openbadgespec.org) that are not available in Open Badges 2.0.
Currently, Open Badges 2.0 data can be verified via either (a) publicly accessible hosted JSON badge data or (b) JWS digitally signed badges with a limited number of algorithms and key types, depending on the verification method chosen by the issuer. In order to keep up with evolving cryptographic standards without taking on the burden of writing cryptographic suites as a community not specializing in that function, adopting Verifiable Credentials proofs will allow experts to update algorithms to keep up with improvements to cryptography-breaking processing power.
Publicly hosted badge data has been the preferred method of many Open Badges issuers. This method can risk the privacy of badge recipients who are reliant on the issuers to host their data leaving them with no direct control over its accessibility. There is also the potential that data about individuals is publicly accessible without their knowledge. Most Open Badges don't contain significant amounts of personally identifiable information, but they are subject to correlation. This could lead to on-site identification, email spam, and also cause badges to be correlatable with other personally identifying data on the web.
Hosted badge data is also not tamper-evident since it is hosted on web servers typically as dynamically-generated JSON files populated by queries made to relational databases or static JSON files. This makes the data easy to change without any historic reference or preservation. This can be convenient for issuers but not assuring for relying third-parties seeking to put the data to use. Changes to badge metadata such as criteria, the issue date, and recipient email can reduce the perceived quality of data and reflect incorrect information about the learners' experiences. Digitally signed 2.0 badges provide more assurances and privacy than the hosted badges but are not commonly issued and are not interoperable with VC wallets.
There's been very little evidence that badge JSON data has been readily consumed by machines, but technologies and the education and workforce markets have evolved since [Open Badges v2.0](https://www.imsglobal.org/spec/ob/v2p0/) was released in 2018. Machine learning and AI uses have expanded alongside blockchain and other decentralized technologies creating opportunity for connecting learners to opportunities, more accurate skills-based hiring, and updated curricula more equitably reflecting the needs of students. The market is demanding that the achievement data be trustworthy. This means that it should be accessible, protected, have integrity, and communicate what was intended including that the issuer and subjects of the data can be authenticated and that the data has not been tampered with since it was issued. Shifting Open Badges to align with the VC conventions to verify learner achievements meets these expectations and provides learners with more agency over their achievement data by giving them immediate access to it for as long as they need it, allowing them to choose which data they share, protecting it, and making it work with other credentials in and outside of education and workforce.

#### 2.3.3 Decentralized Identifiers and Self-Sovereign Identity
With Open Badges up to 2.0, email addresses have been used as identifiers far more commonly than the other available options. This has been problematic because email addresses may be used by more than one person, are often revoked when an individual leaves a job or school, are insecure, and aren't intended to be identifiers. Identifiers in VCs commonly are HTTP-based URLs, follow another scheme of IRI, or take the form of a [Decentralized Identifier](https://www.w3.org/TR/did-use-cases/).
Decentralized identifiers (DIDs) [DID-CORE] are a type of identifier for people, organizations and any other entity, where each identifier is controlled independently of centralized registries. Each DID can be resolved through an operation described by its particular "DID Method" to reveal a DID document that describes the subject. Whereas previous versions of Open Badges required HTTP(s) identifiers for issuers and typically used email (or rarely URL) identifiers for learners, adoption of the Verifiable Credentials Data Model provides simple conventions for badge issuers and recipients to begin to use DIDs when they desire.
Verification of control of identifiers is an important concept within any type of digital credential, both with respect to the issuer and the subject (recipient) of the credential. For issuers, Open Badges has relied on its own bespoke rules for determining whether a hosted Assertion URL or cryptographic key URL is associated with an issuer profile identified by a particular URL. URLs used for recipient identifiers have no built-in mechanism for authentication. Email and telephone number based recipient identifier authentication are up to the relying party, but there are common methods for performing this task essential to establishing trusted proof of control of credentials presented by a subject.
DIDs typically offer cryptographic proof of control, based on authorized keys or other verification methods expressed in the associated DID Document. While these protocols are not broadly implemented across domains today, the structure provides a forward-looking flexible and extensible mechanism to build the types of protocols needed to connect credentials back to the identities of their issuers and subjects. The Open Badges community may ultimately recommend use of only a small number of these capabilities in early releases or recommend them only for experimental use, like with cryptographic proof methods. But this is still an important step, because there is no reason for the Open Badges community to be closed to interoperability through the protocols being developed for use by the wallets and services coming into being elsewhere by delaying the option to use DIDs for recipient and issuer identifiers.

#### 2.3.4 Aligning Open Badges and CLR with Common Assertion and Achievement Models
As described below, it is possible for Open Badges and CLR to produce coordinated specs particularly if both specs are aligned with Verifiable Credentials. Discussion of the components of individual achievements can occur within the Open Badges workgroup, and discussion of more complex use cases necessitating needs for bundling and association of multiple achievements on behalf of a publisher can occur within the CLR group. The cross-pollination of members of each effort will create opportunities to coordinate and ensure that all important use cases for single assertions and bundles of associated assertions are well-handled. The openness of the Open Badges Specification can be preserved so that the broader community can continue to be aware of and connected to the official developments.
At the core, Open Badges and CLR have similar objectives with the primary difference being single vs a collection of credentials. A common assertion model ensures that Open Badges can be included in CLR collections and that both CLRs and Open Badges can be held separately by learners in their Verifiable Credential wallets.
Both Open Badges and CLR make assertions about achievements and conceptually share many similar properties. With some judicious analysis and renaming of some properties, it has been possible to have cross-alignment of achievement properties served by Open Badges and used by CLR. Examples include but are not limited to achievementType which describes the type of achievement being represented, and Result/ResultDescription which can describe possible levels of mastery associated to specific achievements. This will enrich Open Badges data and increase the perceived significance and usage of Open Badges to deliver verifiable single achievements such as certifications, licenses, courses, etc. Using a common model across [OB-30] and [CLR-20] specifications for the core ideas of assertion and achievement will enable the CLR specification to focus on the more complex requirements of bundling collected assertions and expressing the associations between the achievements.

### 2.4 Achievement Credentials
The core claim enabled by Open Badges v3.0 is that of the AchievementCredential, a Verifiable Credential that makes the claim that a subject (usually a learner), has met criteria an issuer has defined for a named Achievement. Standardizing this method of recognizing an achievement allows for issuers across the education and employment ecosystem to create Verifiable Credentials with consistent properties, so that wallets and verifiers can build broadly reusable software to interpret a wide range of use cases that fit into the defined achievement model. Verifiers of AchievementCredentials that are aware of a specific defined achievement SHOULD ensure that the issued AchievementCredential is issued by an issuer they trust to recognize this achievement, usually the creator of the achievement.

#### 2.4.1 Differentiating Issuers and Achievement Creators
In Open Badges and CLR, the issuer is assumed to be the creator. Over the years, the Open Badges community has requested capabilities to distinguish between the issuer and creator of a badge. This is because there are plenty of examples where the assessor is the issuer but not the creator of the badge. The [Original Creator Extensions](https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/extensions/index.html) was a step in this direction but provides no properties to describe the eligibility of issuers trusted by the original creator to duplicate and issue their own assertions of the badge.
In order to open up a wide swath of use cases for shared issuing responsibility of common credentials, we can take advantage of the Verifiable Credentials Data Model to do more. Conveniently, an issuer property for the entity that is digitally signing the credential is included in the VC assertion. We may now separate the issuer from the creator of the Achievement/BadgeClass itself, and in the near term, we may open up use cases for creators to offer verifiable delegation of responsibility for achievement credential issuance. This will enable the use cases and give relying third-parties more contextual information about the achievement and the parties involved. When an Achievement does not include a reference to its creator, verifiers SHOULD interpret it as an entity associated with the credential issuer. Verifiers SHOULD ensure that they trust a particular credential's issuer to recognize the accomplishments described by the Achievement it contains. Verifiers SHOULD NOT trust that an issuer has accurately represented the creator or data of an achievement definition within a credential when that entity is authored by another party, but SHOULD understand that the data within the credential is the data the issuer wished to recognize, even if the verifier encounters a different representation of that data elsewhere.

### 2.5 Skill Assertions
Many of the use cases for Open Badges and CLR involve an issuer's own "defined achievements", where an issuer bundles the details of an educational opportunity, assessment, and criteria they offer using the Achievement data class. In previous versions of Open Badges, the creator of an Achievement (known as a "BadgeClass") was the only entity that could issue it, but in v3.0, the door opens to many issuers recognizing the same achievement based on their own assessment. This practice of shared achievements enables skill assertions, where multiple issuers use a shared achievement definition to recognize achievement of a skill with each issuer doing their own assessment. In addition, further recording of related skills, competencies, standards, and other associations are enabled by the alignment of an Achievement.
A Skill Assertion is an AchievementCredential asserting a subject holds an Achievement that is used by multiple issuers to recognize the same skill. The content of the Achievement, often with achievementType "Competency", is not specific to a learning opportunity or assessment offered by one specific provider only, but is designed to be generic to allow for assessment by any issuer. Verifiers of AchievementCredentials who are looking for a holder to demonstrate a specific Achievement SHOULD ensure that they trust the issuer of a credential to make this claim, because a credential may be considered valid as issued by any issuer, including self-issuance by the subject.

## 3. Use Cases

This section is non-normative.
The use cases below drive the design of Open Badges 3.0 specification.

### 3.1 Assertion Issuance to Wallet
Maya has completed an online course for an "Introduction to Web QA" at her local community college. The community college issues a course completion assertion. When Maya is ready to accept the assertion, she presents her wallet's location to the community college, which generates a request that Maya approves to receive the credential. Maya stores the assertion in her Verifiable Credentials enabled digital wallet with her other credentials.
**Goal of the Primary Actor:** Issue a verifiable credential to a student that she can use to take the next steps in her education journey.
**Actors:** Community college, Maya (student)
**Preconditions for this Use Case:**
- Community college creates badge for course completion
- Maya completes the course
- Maya downloads and installs a VC enabled digital wallet
- Maya has an identifier she uses for educational badges
- Maya is able to connect her wallet to the community college's issuing platform (assuming community college is using a platform) through authentication with the platform
- The community college has established an issuer profile, relevant cryptographic keys, and has published an Achievement corresponding to completion of the "Introduction to Web QA" course.
- Maya has provided an identifier to the college that it has accepted (or controls an identifier that the college has assigned to her)
**Flow of Events:**
1. Maya completes course requirements, receives a grade and is marked as complete for the "Introduction to Web QA" course.
2. Maya provides or selects an identifier to use as her identifier for badges while enrolled at the community college, and proves the identifier represents her to the college if necessary, and through mechanisms appropriate to the identifier type.
3. The community college issues an assertion of the previously defined achievement to Maya's identifier and cryptographically signs it
4. Maya accepts the credential into her wallet.
**Alternative Flows:**
- The badge is issued to a parent or guardian of the recipient:
    1. The school has Maya's parent or guardian identifier on record
    2. Maya completes the course
    3. The school issues an assertion to the parent or guardian identifier
    4. The parent or guardian accepts the credential into their wallet

### 3.2 Assertion Issuance Without a Wallet
A professional development/training vendor Training, Inc. recognizes Dawson's mastery of a competency by issuing an assertion to Dawson's email address.
**Goal of the Primary Actor:** Training, Inc. wishes to provide a verifiable record that Dawson may use to present proof of competency-based professional development.
**Actors:** Training, Inc (professional development/training vendor), Dawson (student)
**Preconditions for this Use Case:**
- Dawson is authenticated, associated with a particular email address to the vendor's platform.
- The vendor has established an issuer profile, defined an Achievement and has the capability to create and deliver assertions to Dawson via Badge Connect
**Flow of Events:**
1. Dawson authenticates to the vendor platform, proving control of a chosen email address.
2. Dawson connects a Badge Connect backpack to the vendor platform, resulting in the platform holding an auth token on his behalf scoped to allow pushing assertions to his backpack.
3. Dawson engages with a learning opportunity, gains new knowledge, skills, and abilities, and successfully completes an assessment demonstrating mastery of a specific competency.
4. Training, Inc. creates an assertion of the achievement that recognizes the competency.
5. Training, Inc. transmits the assertion to Dawson's backpack via Badge Connect API.
**Alternative Flows:**
- Training, Inc. bakes the assertion into a PNG or SVG image file and transmits the image to Dawson who imports the baked badge into his backpack
- Training, Inc. encodes the assertion into a QR code transmits the QR code to Dawson who uses the backpack to scan the QR code and import the assertion

### 3.3 Recipient Presentation of Assertion
Maya registers for an advanced course and she is asked to provide proof that she completed a prerequisite course. From her wallet, Maya presents the course assertion as a verifiable presentation to the MOOC, which cryptographically verifies the issuer of the assertion, that Maya is the recipient, and that the assertion data has not been altered since it was issued. Upon verification, she is registered for the MOOC.
**Goal of the Primary Actor:** Register for advanced "Web QA" course
**Actors:** Maya, MOOC
**Preconditions for this Use Case:**
- Maya completed prerequisite course
- Issuer issued a verifiable assertion (i.e. completion of prerequisite course) to Maya
- Maya has a VC-compatible wallet
- Maya has received the VC representing her competion of the prerequisite course
- The MOOC is capable of receiving the verifiable presentation of the badge
**Flow of Events:**
1. Maya authenticates to the MOOC platform
2. The MOOC platform requests a credential matching a certain criteria (completion of a prerequisite course option)
3. Maya prepares and transmits a presentation of her assertion to the MOOC platform
4. The MOOC platform verifies the assertion is valid and fitting its needs
5. The MOOC platform grants the authenticated user Maya access to the advanced course
**Points of Failure:**
- Maya's wallet and the MOOC platform must be capable of establishing a transmission channel for the assertion.
- The MOOC platform must be capable of expressing a request for a credential that matches the assertion that Maya holds.
- There must be a mutual capability between the wallet and the MOOC platform to prove Maya's is represented by recipient identifier

### 3.4 License Issuance
After Jeremy takes his electrician licensure exam, he accesses the online system for his state's licensure department to see his results and download his license. After he proves his identity by presenting his government issued ID from his digital wallet, he is informed that he passed the exam. The electrician license badge is issued to the DID Jeremy provided and is stored in his digital wallet with his other digital credentials.

### 3.5 Single Skill Assertion
From her school's LMS, Dr. Cara chooses which skills and competencies will be taught in her class. These skills and competencies are aligned with the rubric in the syllabus that is presented to her students. Once the students have successfully completed the course, Dr. Cara assesses each student's assignments and participation and selects which skills and competencies were met and at what level. The selection of skills and competencies triggers an issuing of a skill assertion for each one and includes the assessment results in the evidence and results. The skill assertions are associated with the student's IDs, the students are notified and informed how they can use these skill assessments to inform their choice of classes in the future.

### 3.6 Mapping Skills
Syd is shifting careers after many years working in construction. In their digital wallet they had several skill badges describing their mastery of skills in construction but also in teamwork, communication, and organizational skills. Syd also had badges from some courses they'd taken in science and math over the last few years. After they uploaded the skill and course badges from their wallet to a career planning site, they were offered several opportunities to apply for work in software sales and cybersecurity.

### 3.7 Verifying Continuing Education
Denise was offered a new job at a hospital as a physician's assistant. Before starting, her continuing education training and license to practice needed to be verified. The last time she switched hospitals, the verification process took three weeks. This time, she was able to provide her badges to prove her training and license. Within minutes her credentials were verified and she was issued a new digital staff credential.

### 3.8 Self-assertion
Stacy has created a mobile app that demonstrates her abilities as a coder, designer, and product manager. She creates an account on a badging platform and designs the badge to include alignments to the skills that the badge recognizes. With her digital wallet app, she connects to the badging platform and issues this badge to herself which includes screenshots and a link to the mobile app as evidence. Stacy uses this badge and others like it as verifiable portfolio items.

### 3.9 Endorsement
Ralph has been issued a verifiable credential badge for his most recent position at the hospital where he works by the hospital. The badge contains alignments to the skills related to his role. He requests that his peers endorse the skills he has acquired. A platform is able to communicate this request to peers, facilitate review of the skills, and process the issuance of endorsement VC badges that reference the original badge, colleagues as endorsers, and Ralph as the recipient.

### 3.10 Re-issue a <= 3.0 Badge to a 3.0 Badge
Leo earned several badges while in highschool and graduates soon. The email address used as the recipient identity for these badges was an email address provided by his high school and he will no longer have access to it. Leo downloads a digital wallet and requests that the school reissue the badges to the identifier he created in the wallet.

### 3.11 Authorization to Issue Given by Creator to Issuer
The data model attributes the issuer of a VC and the creator of the badge class separately.
Standards Organization X (SOX) has created a number of badges related to competencies they certify. SOX wants to authorize an accredited, certified training organization (CTO) to issue their credentials. An Open Badge Platform manages the granting of issuing rights to CTO by SOX and can issue verifiable credentials where CTO is the issuer and SOX is the creator inside the badge class.
Employer receives a credential from a graduate. Employer, in addition to verifying the VC in general, can review and verify that SOX did in fact authorize CTO to issue this badge.

### 3.12 Revocation of an Issued Credential
Gigantic State University is a badge issuer. It has awarded a badge to a student in the form of a verifiable credential. Some time after issuing the credential, GSU discovers academic misconduct on the part of the student and needs to revoke the credential's status. GSU updates a list of revoked credential IDs, noting the reason why it was revoked. Future verifications of the issued badge by consumers detect that the credential is now revoked and do not erroneously accept it.
**Goal of the Primary Actor:** Revoke a credential they have already awarded.
**Actors:** Credential issuer, Credential Subject, Consumer/Verifier
**Preconditions for this Use Case:**
- Issuer creates a badge class
- Issuer issues a credential to a subject
- Credential references a revocation list
- Uses the credentialStatus property
- Issuer has access to a revocation list to update
- Verification process of badge credentials checks associated list

### 3.13 Badge Class Status
An institution has issued hundreds of badges in the form of VCs. A situation has arisen that requires the badge class to be effectively deleted or purged from the ecosystem. It is impractical (and arguably inaccurate) to revoke each assertion with individual records in perpetuity. The institution would like to set a status such that the badge class itself is treated as invalid.

### 3.1 Assertion Issuance to Wallet

### 3.2 Assertion Issuance Without a Wallet

### 3.3 Recipient Presentation of Assertion

### 3.4 License Issuance

### 3.5 Single Skill Assertion

### 3.6 Mapping Skills

### 3.7 Verifying Continuing Education

### 3.8 Self-assertion

### 3.9 Endorsement

### 3.10 Re-issue a <= 3.0 Badge to a 3.0 Badge

### 3.11 Authorization to Issue Given by Creator to Issuer

### 3.12 Revocation of an Issued Credential

### 3.13 Badge Class Status

## 4. Getting Started

### 4.1 Implementation Guide
The Open Badges Implementation Guide v3.0 contains non-normative information on how to implement OB 3.0 and [CLR 2.0.](https://www.imsglobal.org/spec/clr/v2p0)

### 4.2 Conformance and Certification
[Open Badges Specification Conformance and Certification Guide v3.0](https://www.imsglobal.org/spec/ob/v3p0/cert/) - Specifies the conformance tests and certification requirements for this specification.

## 5. Open Badges Document Formats

OpenBadgeCredentials can be exchanged as documents as defined in this section, or by using the Open Badges API. Documents can be exchanged as a text file, a web resource, or embedded in an image. The contents of an Open Badge document MUST meet the following criteria:
- The contents of the file MUST represent exactly one OpenBadgeCredential
- The OpenBadgeCredential MUST be serialized as JSON and JSON-LD (see § A. Serialization)
- JSON exchanged between systems that are not part of a closed ecosystem MUST be encoded using UTF-8 [RFC3629].

**Example 1: Verifiable Credential**
```json
{ 
  "@context": [ 
    "https://www.w3.org/ns/credentials/v2", 
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json", 
    "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json" 
  ], 
  "id": "http://example.edu/credentials/3732", 
  "type": ["VerifiableCredential", "OpenBadgeCredential"], 
  "issuer": { 
    "id": "https://example.edu/issuers/565049", 
    "type": ["Profile"], 
    "name": "Example University" 
  }, 
  "validFrom": "2010-01-01T00:00:00Z", 
  "name": "Example University Degree", 
  "credentialSubject": { 
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21", 
    "type": ["AchievementSubject"], 
    "achievement": { 
      "id": "https://example.com/achievements/21st-century-skills/teamwork", 
      "type": ["Achievement"], 
      "criteria": { 
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management." 
      }, 
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.", 
      "name": "Teamwork" 
    } 
  }, 
  "credentialSchema": [{ 
    "id": "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json", 
    "type": "1EdTechJsonSchemaValidator2019" 
  }] 
}
```

**Example 2: Verifiable Credential (with proof)**
```json
{ 
  "@context": [ 
    "https://www.w3.org/ns/credentials/v2", 
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json", 
    "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json" 
  ], 
  "id": "http://example.edu/credentials/3732", 
  "type": [ "VerifiableCredential", "OpenBadgeCredential" ], 
  "issuer": { 
    "id": "https://example.edu/issuers/565049", 
    "type": [ "Profile" ], 
    "name": "Example University" 
  }, 
  "validFrom": "2010-01-01T00:00:00Z", 
  "name": "Example University Degree", 
  "credentialSubject": { 
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21", 
    "type": [ "AchievementSubject" ], 
    "achievement": { 
      "id": "https://example.com/achievements/21st-century-skills/teamwork", 
      "type": [ "Achievement" ], 
      "criteria": { 
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management." 
      }, 
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.", 
      "name": "Teamwork" 
    } 
  }, 
  "credentialSchema": [ { 
    "id": "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json", 
    "type": "1EdTechJsonSchemaValidator2019" 
  } ], 
  "proof": [ { 
    "type": "DataIntegrityProof", 
    "created": "2024-12-23T10:54:14Z", 
    "verificationMethod": "https://example.edu/issuers/565049#z6MkevCo7JVbQxBW1YgPA4JFGMPaxHZZqSNEyoSF9WDoQE7e", 
    "cryptosuite": "eddsa-rdfc-2022", 
    "proofPurpose": "assertionMethod", 
    "proofValue": "z2kyHMLt6Mt2Mj66eG5oq4roEGsSJ4qomwpFfwwfa6DmQzqnzNBpr6Co2FLU3zExUvJLhp7jvBLQoqAnwjDdqu5Ss" 
### 5.1 File Format
If the credential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT) the contents of the file MUST be the Compact JWS string formed as a result of signing the OpenBadgeCredential with VC-JWT. The file extension SHOULD be ".jws" or ".jwt".
If an embedded proof method is used instead, the contents of the file MUST be the JSON representation of the OpenBadgeCredential. The file extension SHOULD be ".json".

### 5.2 Web Resource
If the credential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT) the contents of the response MUST be the Compact JWS string formed as a result of signing the OpenBadgeCredential with VC-JWT. The Content-Type SHOULD be `text/plain`.
If an embedded proof method is used instead, the contents of the response MUST be the JSON representation of the OpenBadgeCredential. The Content-Type SHOULD be `application/vc+ld+json`, although generic representations such `application/ld+json` or `application/json` are also allowed.

### 5.3 Baked Badge
OpenBadgeCredentials may be exchanged as image files with the credential encoded (baked) within. This allows the credential to be portable wherever image files may be stored or displayed.
"Baking" is the process of taking an OpenBadgeCredential and embedding it into the image, so that when a user displays the image on a page, software that is Open Badges aware can automatically extract that OpenBadgeCredential data and perform the checks necessary to see if a person legitimately earned the achievement within the image. The image MUST be in either PNG [PNG] or SVG [SVG11] format in order to support baking.

#### 5.3.1 PNG

##### 5.3.1.1 Baking
An `iTXt` chunk should be inserted into the PNG with keyword `openbadgecredential`.
If the credential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT) the text value of the chunk MUST be the Compact JWS string formed as a result of signing the OpenBadgeCredential with VC-JWT. Compression MUST NOT be used.

**Example: PNG iTXt chunk with JWS**
```javascript
var chunk = new iTXt({ keyword: 'openbadgecredential', compression: 0, compressionMethod: 0, languageTag: '', translatedKeyword: '', text: 'header.payload.signature' })
```

If an embedded proof method is used instead, the text value of the chunk MUST be the JSON representation of the OpenBadgeCredential. Compression MUST NOT be used.

**Example: PNG iTXt chunk with JSON**
```javascript
var chunk = new iTXt({ keyword: 'openbadgecredential', compression: 0, compressionMethod: 0, languageTag: '', translatedKeyword: '', text: '{ "@context": [ "https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json" ], "id": "http://example.edu/credentials/3732", "type": ["VerifiableCredential", "OpenBadgeCredential"], "issuer": { "id": "https://example.edu/issuers/565049", "type": "Profile", "name": "Example University" }, "validFrom": "2010-01-01T00:00:00Z", "credentialSubject": { "id": "did:example:ebfeb1f712ebc6f1c276e12ec21" }, "proof": { } }' })
```
An `iTXt` chunk with the keyword `openbadgecredential` MUST NOT appear in a PNG more than once. When baking an image that already contains credential data, the implementer may choose whether to pass the user an error or overwrite the existing chunk.

##### 5.3.1.2 Extracting
Parse the PNG datastream until the first `iTXt` chunk is found with the keyword `openbadgecredential`. The rest of the stream can be safely discarded. The text portion of the `iTXt` will either be the JSON representation of a § B.1.2 AchievementCredential or the Compact JWS string that was the result of signing the OpenBadgeCredential with § 8.2 JSON Web Token Proof Format.

#### 5.3.2 SVG

##### 5.3.2.1 Baking
First, add an `xmlns:openbadges` attribute to the `<svg>` tag with the value `https://purl.imsglobal.org/ob/v3p0`. Directly after the `<svg>` tag, add an `<openbadges:credential>` tag.
If the credential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT) add a `verify` attribute to the `<openbadges:credential>` tag. The value of `verify` attribute MUST be the Compact JWS string formed as a result of signing the OpenBadgeCredential with VC-JWT.

**Example: SVG with JWS**
```xml
<?xml version="1.0" encoding="UTF-8"?> 
<svg xmlns="http://www.w3.org/2000/svg" xmlns:openbadges="https://purl.imsglobal.org/ob/v3p0" viewBox="0 0 512 512"> 
  <openbadges:credential verify="header.payload.signature"></openbadges:credential> 
  <!-- rest-of-image --> 
</svg>
```

If an embedded proof method is used instead, omit the `verify` attribute, and the JSON representation of the OpenBadgeCredential MUST go into the body of the tag, wrapped in `<![CDATA[...]]>`.

**Example: SVG with JSON**
```xml
<?xml version="1.0" encoding="UTF-8"?> 
<svg xmlns="http://www.w3.org/2000/svg" xmlns:openbadges="https://purl.imsglobal.org/ob/v3p0" viewBox="0 0 512 512"> 
  <openbadges:credential> 
    <![CDATA[ 
      { 
        "@context": [ "https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json" ], 
        "id": "http://example.edu/credentials/3732", 
        "type": ["VerifiableCredential", "OpenBadgeCredential"], 
        "issuer": { 
          "id": "https://example.edu/issuers/565049", 
          "type": "Profile", 
          "name": "Example University" 
        }, 
        "validFrom": "2010-01-01T00:00:00Z", 
        "credentialSubject": { 
          "id": "did:example:ebfeb1f712ebc6f1c276e12ec21" 
        }, 
        "proof": { } 
      } 
    ]]> 
  </openbadges:credential> 
  <!-- rest-of-image --> 
</svg>
```
There MUST be only one `<openbadges:credential>` tag in an SVG. When baking an image that already contains OpenBadgeCredential data, the implementer may choose whether to pass the user an error or overwrite the existing tag.

##### 5.3.2.2 Extracting
Parse the SVG until you reach the first `<openbadges:credential>` tag. The rest of the SVG data can safely be discarded.

## 6. Open Badges API
Open Badges can be exchanged using the API (application programming interface) defined here, or as documents.
This specification defines a RESTful API protocol to be implemented by applications serving in the roles of Client and Resource Server. The API uses OAuth 2.0 for authentication and granular resource-based permission scopes. Please see the [Open Badges Specification Conformance and Certification Guide v3.0](https://www.imsglobal.org/spec/ob/v3p0/cert/) for a list of which endpoints must be implemented for certification.
The API defined here is intended for Clients and servers that give individual users control over access to their resources. While system-to-system bulk transfers using OAuth 2.0 Client-Credentials Grant are expected to occur, it is out of scope for this version of the specification to define. Future versions of this specification may add explicit support for OAuth 2.0 Client-Credentials Grant.
In addition to the documentation in this section, there are OpenAPI files for the Open Badges API in both JSON and YAML format:
- [JSON OpenAPI File](https://purl.imsglobal.org/spec/ob/v3p0/schema/openapi/imsob_v3p0.json)
- [YAML OpenAPI File](https://purl.imsglobal.org/spec/ob/v3p0/schema/openapi/imsob_v3p0.yaml)

### 6.1 Architecture
There are five key components to the API architecture as described in the [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/).

### 6.2 Secure REST Endpoints
These endpoints are used to exchange OpenBadgeCredentials and Profile information.
All secure endpoint requests MUST be made over secure TLS 1.2 or 1.3 protocol.
All of the Secure REST Endpoints are protected by OAuth 2.0 access tokens as described in § 7. Open Badges API Security.

#### 6.2.1 Scopes
Each endpoint requires an access token with a specific Open Badges scope as shown below.
- `getCredentials`: `https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly`
- `upsertCredential`: `https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert`
- `getProfile`: `https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly`
- `putProfile`: `https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update`

#### 6.2.2 getCredentials
Get issued OpenBadgeCredentials from the resource server for the supplied parameters and access token.

##### 6.2.2.1 Request
`GET /ims/ob/v3p0/credentials?limit={limit}&offset={offset}&since={since}`

- `limit`: PositiveInteger
- `offset`: NonNegativeInteger
- `since`: DateTime

##### 6.2.2.2 Responses
- `200 OK`: Returns `GetOpenBadgeCredentialsResponse`
- `400 Bad Request`: `Imsx_StatusInfo`
- `401 Unauthorized`: `Imsx_StatusInfo`
- `403 Forbidden`: `Imsx_StatusInfo`
- `404 Not Found`: `Imsx_StatusInfo`
- `500 Internal Server Error`: `Imsx_StatusInfo`

**Example Request**
```http
GET /ims/ob/v3p0/credentials?limit=2&offset=0 HTTP/1.1
Host: example.edu
Authorization: Bearer 863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92
Accept: application/json
```

**Example Response**
```http
HTTP/1.1 200 OK
Content-Type: application/ld+json
X-Total-Count: 1
Link: <https://www.imsglobal.org/ims/ob/v3p0/credentials?limit=2&offset=1>; rel="next", <https://www.imsglobal.org/ims/ob/v3p0/credentials?limit=2&offset=0>; rel="last", <https://www.imsglobal.org/ims/ob/v3p0/credentials?limit=2&offset=0>; rel="first", <https://www.imsglobal.org/ims/ob/v3p0/credentials?limit=2&offset=0>; rel="prev"

{
  "compactJwsStrings": [
    "header.payload.signature",
    "header.payload.signature"
  ]
}
```

#### 6.2.3 upsertCredential
Create or replace an AchievementCredential on the resource server.

##### 6.2.3.1 Request
`POST /ims/ob/v3p0/credentials`

- Body can be `AchievementCredential` (application/vc+ld+json or application/json) or `CompactJws` (text/plain).

##### 6.2.3.2 Responses
- `200 OK`: Returns `AchievementCredential` or `CompactJws`.
- `201 Created`: Returns `AchievementCredential` or `CompactJws`.
- `400 Bad Request`: `Imsx_StatusInfo`
- `401 Unauthorized`: `Imsx_StatusInfo`
- `403 Forbidden`: `Imsx_StatusInfo`
- `404 Not Found`: `Imsx_StatusInfo`
- `500 Internal Server Error`: `Imsx_StatusInfo`

**Example Request**
```http
POST /ims/ob/v3p0/credentials HTTP/1.1
Host: example.edu
Authorization: Bearer 863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92
Accept: text/plain
Content-Type: text/plain

header.payload.signature
```

**Example Response**
```http
HTTP/1.1 200 OK
Content-Type: text/plain

header.payload.signature
```

#### 6.2.4 getProfile
Fetch the profile from the resource server for the supplied access token.

##### 6.2.4.1 Request
`GET /ims/ob/v3p0/profile`

##### 6.2.4.2 Responses
- `200 OK`: Returns `Profile`.
- `400 Bad Request`: `Imsx_StatusInfo`
- `401 Unauthorized`: `Imsx_StatusInfo`
- `403 Forbidden`: `Imsx_StatusInfo`
- `404 Not Found`: `Imsx_StatusInfo`
- `500 Internal Server Error`: `Imsx_StatusInfo`

**Example Request**
```http
GET /ims/ob/v3p0/profile HTTP/1.1
Host: example.edu
Authorization: Bearer 863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92
Accept: application/json
```

**Example Response**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "@context": [
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "type": "Profile",
  "id": "https://example.edu/issuers/565049",
  "name": "Example University"
}
```

#### 6.2.5 putProfile
Update the profile for the authenticated entity.

##### 6.2.5.1 Request
`PUT /ims/ob/v3p0/profile`

- Body is a `Profile` object.

##### 6.2.5.2 Responses
- `200 OK`: Returns `Profile`.
- `400 Bad Request`: `Imsx_StatusInfo`
- `401 Unauthorized`: `Imsx_StatusInfo`
- `403 Forbidden`: `Imsx_StatusInfo`
- `404 Not Found`: `Imsx_StatusInfo`
- `500 Internal Server Error`: `Imsx_StatusInfo`

**Example Request**
```http
PUT /ims/ob/v3p0/profile HTTP/1.1
Host: example.edu
Authorization: Bearer 863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92
Accept: application/json
Content-Type: application/json

{
  "@context": [
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "type": "Profile",
  "id": "https://example.edu/issuers/565049",
  "name": "Example University",
  "phone": "111-222-3333"
}
```

**Example Response**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "@context": [
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "type": "Profile",
  "id": "https://example.edu/issuers/565049",
  "name": "Example University",
  "phone": "111-222-3333"
}
```

### 6.3 Service Discovery Endpoint
Access to the discovery endpoint MUST NOT be protected. The Service Description Document (SDD) MUST be provided over HTTPS with TLS 1.2 or 1.3.

#### 6.3.1 getServiceDescription
Fetch the Service Description Document from the resource server.

##### 6.3.1.1 Request
`GET /ims/ob/v3p0/discovery`

##### 6.3.1.2 Responses
- `200 OK`: Returns `ServiceDescriptionDocument`
- `500 Internal Server Error`: `Imsx_StatusInfo`

**Example Request**
```http
GET /ims/ob/v3p0/discovery HTTP/1.1
Host: example.edu
Accept: application/json
```

**Example Response**
```json
{
  "components": {
    "securitySchemes": {
      "OAuth2ACG": {
        "type": "oauth2",
        "description": "OAuth 2.0 Authorization Code Grant authorization",
        "x-imssf-name": "Example Provider",
        "x-imssf-privacyPolicyUrl": "provider.example.com/privacy",
        "x-imssf-registrationUrl": "provider.example.com/registration",
        "x-imssf-termsOfServiceUrl": "provider.example.com/terms",
        "flows": {
          "authorizationCode": {
            "tokenUrl": "provider.example.com/token",
            "authorizationUrl": "provider.example.com/authorize",
            "refreshUrl": "provider.example.com/token",
            "scopes": {
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update": "..."
            }
          }
        }
      }
    },
    "schemas": {}
  }
}
```

### 6.4 Paging
Pagination of `getCredentials` results is controlled by two query string parameters. The response includes pagination headers.
- `X-Total-Count`: The total count of results.
- `Link`: Contains links for `next`, `last`, `first`, and `prev` pages, as described in [RFC8288](https://tools.ietf.org/html/rfc8288).

### 6.5 Retry Behavior
Resource Servers MAY implement a `Retry-After` header. If not present on a non-2XX response, it is recommended to retry the request in 30 minutes for an additional two attempts.

## 7. Open Badges API Security
The Open Badges API endpoints use the methods outlined in Section 4, "Securing Web Services" of the [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/). Clients and servers that give individual users control over access to their resources MUST use the OAuth 2.0 Authorization Code Grant method.

### 7.1 Using OAuth 2.0 Authorization Code Grant
Making a secured Open Badges API request using authorization code grant comprises three steps:
1.  **Dynamic Client Registration**: Share configuration information between the client and the server.
2.  **Obtaining Tokens**: Obtain an authorization code and then an access token.
3.  **Authenticating with Tokens**: Use the access token in the Authorization header.

#### 7.1.1 Dynamic Client Registration
To get started, the client and authorization server MUST share information using the OAuth 2.0 Dynamic Client Registration Protocol [RFC7591].

There are two steps to dynamic client registration:
1.  Request a Service Description Document (SDD) from the resource server.
2.  Register with the authorization server.

##### 7.1.1.1 Request the Service Description Document
The client requests the SDD at `{baseUrl}/ims/ob/v3p0/discovery`. The response is a JSON object following the OpenAPI 3.0 Specification.

**Example Request**
```http
GET /tenant/ims/ob/v3p0/discovery HTTP/1.1
Host: 1edtech.org
Accept: application/json
```

**Example Response**
```json
{
  "info": {
    "x-imssf-image": "https://1edtech.org/logo",
    "x-imssf-privacyPolicyUrl": "https://1edtech.org/privacy",
    "title": "Example",
    "termsOfService": "https://1edtech.org/tos"
  },
  "components": {
    "securitySchemes": {
      "OAuth2ACG": {
        "type": "oauth2",
        "description": "OAuth 2.0 Authorization Code Grant authorization",
        "x-imssf-registrationUrl": "1edtech.org/registration",
        "flows": {
          "authorizationCode": {
            "tokenUrl": "1edtech.org/token",
            "authorizationUrl": "1edtech.org/authorize",
            "refreshUrl": "1edtech.org/token",
            "scopes": {
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly": "...",
              "https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update": "..."
            }
          }
        }
      }
    },
    "schemas": {}
  }
}
```

##### 7.1.1.2 Register with Authorization Server
The client posts a registration request to the `x-imssf-registrationUrl` from the SDD. The request MUST comply with [RFC7591]. The JSON body includes properties like `client_name`, `client_uri`, `logo_uri`, `redirect_uris`, and `scope`.

The list of scopes that can be requested are shown in § 6.2.1 Scopes.
The properties of the JSON body MUST be implemented as described in the following table:
- `token_endpoint_auth_method`: String. "client_secret_basic" is one option.
- `grant_types`: String[]. "authorization_code", "refresh_token".
- `response_types`: String[]. "code".
- `contacts`: String[].

**Example Registration Request**
```http
POST /connect/register HTTP/1.1
Host: auth.1edtech.org
Accept: application/json
Content-Type: application/json; charset=utf-8

{
  "client_name": "Example Client Application",
  "client_uri": "https://client.1edtech.org/",
  "logo_uri": "https://client.1edtech.org/logo.png",
  "tos_uri": "https://client.1edtech.org/terms",
  "policy_uri": "https://client.1edtech.org/privacy",
  "software_id": "c88b6ed8-269e-448e-99be-7e2ff47167d1",
  "software_version": "v4.0.30319",
  "redirect_uris": [
    "https://client.1edtech.org/Authorize"
  ],
  "token_endpoint_auth_method": "client_secret_basic",
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "response_types": [
    "code"
  ],
  "scope": "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert offline_access"
}
```

If the authorization server accepts the request, it responds with HTTP 201 Created and a body containing client credentials.

**Example Registration Response**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "client_id": "4ad36680810420ed",
  "client_secret": "af7aa0d679778e12",
  "client_id_issued_at": 1565715850,
  "client_secret_expires_at": 1597338250,
  "client_name": "Example Client Application",
  "client_uri": "https://client.1edtech.org/",
  "logo_uri": "https://client.1edtech.org/logo.png",
  "tos_uri": "https://client.1edtech.org/terms",
  "policy_uri": "https://client.1edtech.org/privacy",
  "software_id": "c88b6ed8-269e-448e-99be-7e2ff47167d1",
  "software_version": "v4.0.30319",
  "redirect_uris": [
    "https://client.1edtech.org/Authorize"
  ],
  "token_endpoint_auth_method": "client_secret_basic",
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "response_types": [
    "code"
  ],
  "scope": "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert offline_access"
}
```
The response includes `client_id`, `client_secret`, `client_id_issued_at`, and `client_secret_expires_at`.

#### 7.1.2 Obtaining Tokens
Obtaining an access token has two steps:
1.  **Authorization Request**: Obtain an authorization code.
2.  **Access Token Request**: Exchange the authorization code for an access token.

##### 7.1.2.1 Authorization Request
The client initiates an authorization request by redirecting the user to the `authorizationUrl`. PKCE (Proof Key for Code Exchange) MUST be used.
- The client supplies a `code_challenge` and `code_challenge_method`.
- The client later supplies a `code_verifier` in the Access Token Request.

The request parameters (`response_type`, `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method`) are encoded as query string parameters.

**Example Authorization Request**
```http
HTTP/1.1 302 Found
Location: https://auth.1edtech.org/authorize?client_id=4ad36680810420ed&response_type=code&scope=https%3A%2F%2Fpurl.imsglobal.org%2Fspec%ob%2Fv3p0%2Fscope%2Fcredential.readonly%20offline_access&redirect_uri=https%3A%2F%client.1edtech.org%2FAuthorize&state=26357667-94df-4a14-bcb1-f55449ddd98d&code_challenge=XeDw66i9FLjn7XaecT_xaFyUWWfUub02Kw118n-jbEs&code_challenge_method=S256
```

##### 7.1.2.2 Authorization Response
If the user authorizes the request, the authorization server redirects back to the `redirect_uri` with `code`, `scope`, and `state` parameters. The authorization code MUST be used only once.

**Example Authorization Response**
```http
HTTP/1.1 302 Found
Location: https://client.1edtech.org/Authorize?code=dcf95d196ae04d60aad7e19d18b9af755a7b593b680055158b8ad9c2975f0d86&scope=https%3A%2F%2Fpurl.imsglobal.org%2Fspec%ob%2Fv3p0%2Fscope%2Fcredential.readonly%20offline_access&state=26357667-94df-4a14-bcb1-f55449ddd98d
```

###### 7.1.2.2.1 Authorization Error Response
If an error occurs, the authorization server redirects with `error`, `error_description`, `error_uri`, and `state` parameters.

**Example Error Response**
```http
HTTP/1.1 302 Found
Location: https://client.1edtech.org/cb?error=access_denied&state=xyz
```

##### 7.1.2.3 Access Token Request
With the supplied `code`, the client application makes a POST request to the `tokenUrl` to exchange it for an `access_token`.
The HTTP POST request MUST include a Basic authorization header with the `client_id` and `client_secret`. The body of the token request MUST include the following form fields:
- `grant_type`: String
- `code`: String
- `redirect_uri`: URL
- `scope`: String
- `code_verifier`: String

**Example Access Token Request**
```http
POST /token HTTP/1.1
Host: auth.1edtech.org
Authorization: Basic NDE2ZjI1YjhjMWQ5OThlODoxNWQ5MDA4NTk2NDdkZDlm
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=7c7a73263ee14b2b48073d0615f286ec74f6636689046cb8dbede0b5e87a1338&redirect_uri=https%3A%2F%client.1edtech.org%2FAuthorize&scope=https%3A%2F%2Fpurl.imsglobal.org%2Fspec%2Fob%2Fv3p0%2Fscope%2Fcredential.readonly+offline_access&code_verifier=mYUQfKNgI1lSbY8EqtvNHLPzu0x%2FcVKO3fpWnX4VE5I%3D
```

##### 7.1.2.4 Access Token Response
If the request is granted, the server returns an HTTP 200 OK with a JSON object containing the access token.

**Example Access Token Response**
```http
HTTP/1.1 200 OK
Cache-Control: no-store, no-cache, max-age=0
Pragma: no-cache
Content-Type: application/json; charset=UTF-8

{
  "access_token": "863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92",
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly offline_access"
}
```

###### 7.1.2.4.1 Access Token Error Response
If the request is denied, the server returns an HTTP 400 Bad Request with a JSON error object.

**Example Error Response**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "error": "invalid_request"
}
```

#### 7.1.3 Authenticating with Tokens
After obtaining an `access_token`, a client application may issue requests to the resource server using the `access_token` in the HTTP Authorization header with a Bearer Token.

**Example Authenticated Request**
```http
GET /ims/ob/v3p0/credentials HTTP/1.1
Host: example.edu
Authorization: Bearer 863DF0B10F5D432EB2933C2A37CD3135A7BB7B07A68F65D92
Accept: application/json
```

### 7.2 Token Refresh
When an access token expires, a refresh token can be used to obtain a new access token without re-authenticating the user.

#### 7.2.1 Token Refresh Request
The client makes a POST request to the token endpoint with `grant_type=refresh_token` and the `refresh_token`.

**Example Token Refresh Request**
```http
POST /token HTTP/1.1
Host: auth.1edtech.org
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA&scope=https%3A%2F%2Fpurl.imsglobal.org%2Fspec%2Fob%2Fv3p0%2Fscope%2credential.readonly
```

#### 7.2.2 Token Refresh Response
The authorization server issues a new access token and optionally a new refresh token.

### 7.3 Token Revocation
An access token or refresh token can be revoked by making a POST request to the token revocation endpoint.

#### 7.3.1 Token Revocation Request
The client includes the `token` and an optional `token_type_hint`.

**Example Token Revocation Request**
```http
POST /revoke HTTP/1.1
Host: auth.1edtech.org
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

token=45ghiukldjahdnhzdauz&token_type_hint=refresh_token
```

#### 7.3.2 Token Revocation Response
The server responds with HTTP 200 OK if the token was revoked successfully or was invalid.

## 8. Proofs (Signatures)
This section describes mechanisms for ensuring the authenticity and integrity of OpenBadgeCredentials. At least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential; that is, to be verifiable. In order to pass 1EdTech conformance tests, issuers MUST use a proof mechanism supported by the 1EdTech conformance test suite. See more about [Selecting proof methods and crypto algorithms](https://www.imsglobal.org/spec/ob/impl) in the Implementation Guide.

### 8.1 Proof Formats
The proof formats included in this specification fall into two categories:
- **JSON Web Token Proof**: Sometimes called VC-JWT, this format has a single implementation: the credential is encoded into a JWT which is then signed and encoded as a JWS. The JSON Web Token proof is called an external proof because the proof wraps the credential object.
- **Linked Data Proofs**: The credential is signed and the signature is used to form a Proof object which is appended to the credential. This format supports many different proof types. These are called embedded proofs because the proof is embedded in the data.

A third category of proof format called Non-Signature Proof is not covered by this specification. This category includes proofs such as proof of work.

### 8.2 JSON Web Token Proof Format
This proof format relies on the well established JWT (JSON Web Token) [RFC7519] and JWS (JSON Web Signature) [RFC7515] specifications. A JSON Web Token Proof is a JWT signed and encoded as a Compact JWS string. The proof format is described in detail in [VC-JOSE-COSE], referred from Section 5.13 "Securing Mechanism Specifications" of Verifiable Credentials Data Model v2.0. That description allows several options which may inhibit interoperability. This specification limits the options while maintaining compatibility with [VC-DATA-MODEL-2.0] to help ensure interoperability.

#### 8.2.1 Terminology
Some of the terms used in this section include:
- **JWT**: "JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted." [RFC7519]
- **JWS**: "JSON Web Signature (JWS) represents content secured with digital signatures or Message Authentication Codes (MACs) using JSON-based data structures. Cryptographic algorithms and identifiers for use with this specification are described in the separate JSON Web Algorithms (JWA) specification and an IANA registry defined by that specification." [RFC7515]
- **JWK**: "A JSON Web Key (JWK) is a JavaScript Object Notation (JSON) data structure that represents a cryptographic key." [RFC7517]
- **Compact JWS**: "A compact representation of a JWS." [RFC7515]

#### 8.2.2 Overview
A JWS is a signed JWT with three parts separated by period (".") characters. Each part contains a base64url-encoded value.
- **JOSE Header**: Describes the cryptographic operations applied to the JWT and optionally, additional properties of the JWT. [RFC7515]
- **JWT Payload**: The JSON object that will be signed. In this specification, the JWT Payload includes the OpenBadgeCredential.
- **JWS Signature**: The computed signature of the JWT Payload.

The JOSE Header, JWT Payload, and JWS Signature are combined to form a Compact JWS. To transform a credential into a Compact JWS takes 4 steps:
1. Create the JOSE Header, specifying the signing algorithm to use
2. Create the JWT Payload from the credential to be signed
3. Compute the signature of the JWT Payload
4. Encode the resulting JWS as a Compact JWS

The resulting JWS proves that the issuer signed the JWT Payload turning the credential into a verifiable credential.
When using the JSON Web Token Proof Format, the `proof` property MAY be omitted from the OpenBadgeCredential. If a Linked Data Proof is also provided, it MUST be created before the JSON Web Token Proof Format is created.

#### 8.2.3 Create the JOSE Header
The JOSE Header is a JSON object with the following properties (also called JOSE Headers). Additional JOSE Headers are NOT allowed.
- `alg`: String. The signing algorithm. See [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/).
- `kid`: URI. A key identifier. It can be dereferenced to retrieve a JWK.
- `jwk`: A JSON Web Key [RFC7517]. It MUST NOT contain the private key portion ("d").
- `typ`: String. The type of the token.

**Example JOSE Header**
```json
{ 
  "alg": "RS256", 
  "kid": "https://example.edu/keys#key-1", 
  "typ": "JWT" 
}
```

#### 8.2.4 Create the JWT Payload
If you are going to use both external and embedded proof formats, add the embedded proofs prior to creating the JWT Payload.

##### 8.2.4.1 JWT Payload Format
The JWT Payload is the JSON object of the OpenBadgeCredential with the following properties (JWT Claims). Additional standard JWT Claims Names are allowed, but their relationship to the credential is not defined.
- `exp`: NumericDate. Corresponds to `validUntil`.
- `iss`: URI. Corresponds to `issuer.id`.
- `jti`: URI. Corresponds to `id`.
- `nbf`: NumericDate. Corresponds to `validFrom`.
- `sub`: URI. Corresponds to `credentialSubject.id`.

#### 8.2.5 Create the Proof
1EdTech strongly recommends using an existing, stable library for this step.

This section uses the follow notations:
- `JOSE Header` - denotes the JSON string representation of the JOSE Header.
- `JWT Payload` - denotes the JSON string representation of the JWT Payload.
- `BASE64URL(OCTETS)` - denotes the base64url encoding of OCTETS per [RFC7515].
- `UTF8(STRING)` - denotes the octets of the UTF-8 [RFC3629] representation of STRING.
- The concatenation of two values A and B is denoted as `A || B`.

The steps to sign and encode the credential as a Compact JWS are shown below:
1. Encode the JOSE Header as `BASE64URL(UTF8(JOSE Header))`.
2. Encode the JWT Payload as `BASE64URL(JWT Payload)`.
3. Concatenate the encoded JOSE Header and the encoded JSW Payload as `A | "." | B`.
4. Calculate the JWS Signature for `C` as described in [RFC7515].
5. Encode the signature as `BASE64URL(JWS Signature)`.
6. Concatenate `C` and `E` as `C | "." | E`.

The resulting string is the Compact JWS representation of the credential. The Compact JWS includes the credential AND acts as the proof for the credential.

#### 8.2.6 Verify a Credential
Verifiers that receive a OpenBadgeCredential in Compact JWS format MUST perform the following steps to verify the embedded credential.
1. Base64url-decode the JOSE Header.
2. If the header includes a `kid` property, Dereference the `kid` value to retrieve the public key JWK.
3. If the header includes a `jwk` property, convert the `jwk` value into the public key JWK.
4. Use the public key JWK to verify the signature as described in "Section 5.2 Message Signature or MAC Validation" of [RFC7515]. If the signature is not valid, the credential proof is not valid.
5. Base64url-decode the JWT Payload segment of the Compact JWS and parse it into a JSON object.
6. Convert the value of the JWT Payload to an OpenBadgeCredential and continue with § 8.2.6.1 Verify a Credential VC-JWT Signature.

##### 8.2.6.1 Verify a Credential VC-JWT Signature
- The JSON object MUST have the `iss` claim, and the value MUST match the `issuer.id` of the OpenBadgeCredential object. If they do not match, the credential is not valid.
- The JSON object MUST have the `sub` claim, and the value MUST match the `credentialSubject.id` of the OpenBadgeCredential object. If they do not match, the credential is not valid.
- The JSON object MUST have the `nbf` claim, and the NumericDate value MUST be converted to a DateTime, and MUST equal the `validFrom` of the OpenBadgeCredential object. If they do not match or if the `validFrom` has not yet occurred, the credential is not valid.
- The JSON object MUST have the `jti` claim, and the value MUST match the `id` of the OpenBadgeCredential object. If they do not match, the credential is not valid.
- If the JSON object has the `exp` claim, the NumericDate MUST be converted to a DateTime, and MUST be used to set the value of the `validUntil` of the OpenBadgeCredential object. If the credential has expired, the credential is not valid.

### 8.3 Linked Data Proof Format
This standard supports the Linked Data Proof format. In order to pass conformance tests for this format issuers MUST use an option supported by the 1EdTech conformance test suite, which is currently limited to the [Data Integrity EdDSA Cryptosuites v1.0](https://www.w3.org/TR/vc-di-eddsa/) suite.

#### 8.3.1 Create the Proof
Attach a Linked Data Proof to the credential, for example by following these steps to use a proof with the [VC-DI-EDDSA] suite:
1. Create an instance of Multikey as shown in Section 2.1.1 DataIntegrityProof of [VC-DI-EDDSA].
2. Using the key material, sign the credential object as shown in Section 7.1 Proof Algorithm of [DATA-INTEGRITY-SPEC] to produce a Proof as shown in Section 2.2.1 DataIntegrityProof of [VC-DI-EDDSA] with a `proofPurpose` of "assertionMethod".
3. Add the resulting proof object to the credential `proof` property.

#### 8.3.2 Verify an OpenBadgeCredential Linked Data Signature
Verify the Linked Data Proof signature as shown in Section 7.2 Proof Verification Algorithm of [DATA-INTEGRITY-SPEC].

### 8.4 Key Management
Issuers will need to manage asymmetric keys. The mechanisms by which keys are minted and distributed is outside the scope of this specification. See Section 6. Key Management of the [IMS Global Security Framework v1.1](https://www.imsglobal.org/spec/security/v1p1/).

### 8.5 Dereferencing the Public Key
All the proof formats in this specification, and all Digital Integrity proofs in general, require the verifier to "dereference" the public key from a URI. Dereferencing means using the URI to get the public key in JWK format. This specification allows the use of an HTTP URL (e.g. `https://1edtech.org/keys/1`) or a DID URL (e.g. `did:key:123`), but only requires HTTP URL support.

## 9. Verification and Validation
**Verification** is the process to determine whether a verifiable credential or verifiable presentation is an authentic and timely statement of the issuer or presenter respectively. This includes checking that: the credential (or presentation) conforms to the specification; the proof method is satisfied; and, if present, the status check succeeds. Verification of a credential does not imply evaluation of the truth of claims encoded in the credential.

**Validation** is the process of assuring the verifiable credential or verifiable presentation meets the needs of the verifier and other dependent stakeholders. Validating verifiable credentials or verifiable presentations is outside the scope of this specification.

### 9.1 OpenBadgeCredential Verification
This section applies to Verifiable Credentials with a `type` of "OpenBadgeCredential" or "AchievementCredential".

1.  **Check that the OpenBadgeCredential conforms to the specification**:
    - If the OpenBadgeCredential has a `credentialSchema` property, and the type of the CredentialSchema object is "1EdTechJsonSchemaValidator2019", check that the credential conforms to JSON Schema as shown in 1EdTech JSON Schema Validator 2019. If it does not, the credential does not conform to the specification.
    - Check that the `credentialSubject` is identified by an `id` and/or an `identifier`. If neither is present, the credential does not conform to the specification.
    > **Note**: OpenBadgeCredentials created following Verifiable Credentials Data Model v1.1 ([VC-DATA-MODEL]) have different names for attributes used in this process. Concretely, they have `issuanceDate` and `expirationDate` instead of `validFrom` and `validUntil`, respectively.

2.  **Check that the proof method is satisfied**:
    - If the OpenBadgeCredential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT), verify the signature as shown in § 8.2.6 Verify a Credential. If the OpenBadgeCredential is signed using an embedded proof, verify the signature as shown in § 8.3.2 Verify an OpenBadgeCredential Linked Data Signature. If the signature cannot be verified, the proof method is not satisfied.
    > **Note**: The OpenBadgeCredential may have a VC-JWT proof and one or more Linked Data proofs. In this case, the Linked Data proofs will be attached to the OpenBadgeCredential in the signed JWT Payload. You may accept any one proof for verification. You do not need to verify all the signatures.

3.  **Refresh the OpenBadgeCredential**:
    - If the `refreshService` property is present, and the `type` of the RefreshService object is "1EdTechCredentialRefresh", refresh the OpenBadgeCredential as shown in [1EdTech Credential Refresh Service](https://www.imsglobal.org/spec/vccr/v1p0/) and then repeat steps 1 and 2. If the refresh is not successful, continue the verification process using the original OpenBadgeCredential.
    > **Note**: Only perform Refresh once. That is, do not complete Refresh a second time even if the refreshed OpenBadgeCredential also has a `refreshService` defined.

4.  **Check the status**:
    - A Credential is revoked if the `credentialStatus` property is present, and the `type` of the CredentialStatus object is "1EdTechRevocationList", and if the ClrCredential has been revoked as shown in [1EdTech Revocation List Status Method](https://www.imsglobal.org/spec/vcrl/v1p0/).
    - If the current date and time is before the `validFrom`, the OpenBadgeCredential is not yet valid.
    - If the current date and time is after the `validUntil`, the OpenBadgeCredential is expired.

5.  **Optionally verify the subject (recipient)**:
    > **Note**: This step is optional, but RECOMMENDED when the OpenBadgeCredential has been exchanged with the verifier as one of the § 5. Open Badges Document Formats.
    - An OpenBadgeCredential is about a person called the recipient. The recipient is identified in the `credentialSubject` by `id` and/or one or more `identifier`. The `id` or `identifier` value to use for verification must be shared with the verifier in an out-of-band process such as by email. This is called the known value.
    - To verify the recipient using a known `id`, simply compare the known value with the `id` in the `ClrSubject`. If they are equal then the recipient is verified.
    - To verify the recipient using a known identifier such as email address follow these steps shown in § 9.3 Verify the Recipient Using an Identifier. If you find a match then the recipient is verified.
    - If no match is found, the recipient is not verified.

6.  **Verify EndorsementCredentials**:
    - If the OpenBadgeCredential contains any EndorsementCredentials, verify the EndorsementCredentials as shown in § 9.2 EndorsementCredential Verification.

If all the above steps pass, the OpenBadgeCredential may be treated as verified.

### 9.2 EndorsementCredential Verification
This section applies to Verifiable Credentials with a `type` of "EndorsementCredential".

1.  **Check that the EndorsementCredential conforms to the specification**:
    - If the credential has a `credentialSchema` property, and the `type` of the CredentialSchema object is "1EdTechJsonSchemaValidator2019", check that the credential conforms to JSON Schema as shown in [1EdTech JSON Schema Validator 2019](https://www.imsglobal.org/spec/vccs/v1p0/). If it does not, the credential does not conform to the specification.

2.  **Check that the proof method is satisfied**:
    - If the EndorsementCredential is signed using the § 8.2 JSON Web Token Proof Format (VC-JWT), verify the signature as shown in § 8.2.6 Verify a Credential. If the EndorsementCredential is signed using an embedded proof, verify the signature as shown in § 8.3.2 Verify an OpenBadgeCredential Linked Data Signature. If the signature cannot be verified, the proof method is not satisfied.

3.  **Refresh the EndorsementCredential**:
    - If the `refreshService` property is present, and the `type` of the RefreshService object is "1EdTechCredentialRefresh", refresh the EndorsementCredential as shown in [1EdTech Credential Refresh Service](https://www.imsglobal.org/spec/vccr/v1p0/) and then repeat steps 1 and 2. If the refresh is not successful, continue the verification process using the original EndorsementCredential.

4.  **Check the status**:
    - If the `credentialStatus` property is present, and the `type` of the CredentialStatus object is "1EdTechRevocationList", determine if the EndorsementCredential has been revoked as shown in [1EdTech Revocation List Status Method](https://www.imsglobal.org/spec/vcrl/v1p0/).
    - If the current date and time is before the `validFrom`, the EndorsementCredential is not yet valid.
    - If the current date and time is after the `validUntil`, the EndorsementCredential is expired.

### 9.3 Verify the Recipient Using an Identifier
To verify the recipient using a known identifier such as an email address, follow these steps:
1.  From the `credentialSubject.identifier` array, select an `IdentityObject` that has the same `type` as the known identifier.
2.  If the `hashed` property of the `IdentityObject` is `false`, compare the `identity` property to the known value. If they are equal, the recipient is verified.
3.  If the `hashed` property is `true`, hash the known value using the algorithm specified in the `salt` property of the `IdentityObject`, and compare the result to the `identity` property. If they are equal, the recipient is verified.

## 10. Credential equality and comparison algorithm
Credential equality and comparison is the process to determine whether a verifiable credential is semantically equivalent to another one.
A Host SHOULD treat a credential as the same as another when both the issuer `id` and the `AchievementCredential` `id` are equal after unescaping of any percent encoded characters [RFC3986] followed by truncation of leading and trailing whitespace.

If the two credentials are equal according to the above, then the credential with the newer `validFrom` is the more up-to-date representation and could be interpreted as a replacement of the prior issued credential.

### 10.1 Examples

#### 10.1.1 Equality
Credentials A and B are equal since they have the same `id` and the same `issuer.id`.

**Example: Credential A**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://www.w3.org/2018/credentials/examples/v2"
  ],
  "id": "http://example.edu/credentials/3732",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://example.edu/issuers/565049",
    "type": ["Profile"],
    "name": "Example University"
  },
  "validFrom": "2010-01-01T00:00:00Z",
  "name": "Teamwork Badge",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.com/achievements/21st-century-skills/teamwork",
      "type": ["Achievement"],
      "criteria": {
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management."
      },
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.",
      "name": "Teamwork"
    }
  }
}
```

**Example: Credential B**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://www.w3.org/2018/credentials/examples/v2"
  ],
  "id": "http://example.edu/credentials/3732",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://example.edu/issuers/565049",
    "type": ["Profile"],
    "name": "Example University"
  },
  "validFrom": "2010-01-01T00:00:00Z",
  "name": "Teamwork Badge",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.com/achievements/21st-century-skills/teamwork",
      "type": ["Achievement"],
      "criteria": {
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management."
      },
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.",
      "name": "Teamwork"
    }
  }
}
```
Since they also have the same `validFrom` both are up-to-date.

#### 10.1.2 Comparison
Credentials C and D are equal since they have the same `id` and the same `issuer.id`.

**Example: Credential C**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://www.w3.org/2018/credentials/examples/v2"
  ],
  "id": "http://example.edu/credentials/3732",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://example.edu/issuers/565049",
    "type": ["Profile"],
    "name": "Example University"
  },
  "validFrom": "2010-03-01T00:00:00Z",
  "name": "Teamwork Badge",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.com/achievements/21st-century-.skills/teamwork",
      "type": ["Achievement"],
      "criteria": {
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management."
      },
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.",
      "name": "Teamwork"
    }
  }
}
```

**Example: Credential D**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://www.w3.org/2018/credentials/examples/v2"
  ],
  "id": "http://example.edu/credentials/3732",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://example.edu/issuers/565049",
    "type": ["Profile"],
    "name": "Example University"
  },
  "validFrom": "2010-01-01T00:00:00Z",
  "name": "Teamwork Badge",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.com/achievements/21st-century-skills/teamwork",
      "type": ["Achievement"],
      "criteria": {
        "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management."
      },
      "description": "This badge recognizes the development of the capacity to collaborate within a group environment.",
      "name": "Teamwork"
    }
  }
}
```
The credential C is the up-to-date representation because it has a more recent `validFrom` (2010-03-01T00:00:00Z).

## 11. Verifiable Credentials Extensions
The Verifiable Credentials Data Model v2.0 standard defines several types of extensions to enable "permissionless innovation". Conformant extensions are tracked in the [Verifiable Credentials Extension Registry](https://w3c-ccg.github.io/vc-extension-registry/).
This standard references four VC Extensions:
- A Proof Method called DataIntegrityProof defined at [Data Integrity EdDSA Cryptosuites v1.0](https://www.w3.org/TR/vc-di-eddsa/)
- A Status Method called [1EdTech Revocation List Status Method](https://www.imsglobal.org/spec/vcrl/v1p0/)
- A Refresh Method called [1EdTech Credential Refresh Service](https://www.imsglobal.org/spec/vccr/v1p0/)
- A Data Schema Validation Method called [1EdTech JSON Schema Validator 2019](https://www.imsglobal.org/spec/vccs/v1p0/)

## A. Serialization

The data model as described in Appendix § B. Data Models is the canonical structural representation of an Open Badges verifiable credential (AchievementCredential). All serializations are representations of that data model in a specific format. This section specifies how the data model is realized in JSON-LD and plain JSON.

### A.1 JSON

The data model can be encoded in Javascript Object Notation (JSON) [RFC8259] by mapping property types in the Data Model to JSON types as follows:

- Numeric values representable as [IEEE-754] MUST be represented as a JSON Number.
- Boolean values MUST be represented as a JSON Boolean.
- Sequence values MUST be represented as an JSON Array, NOT as a single value.
- Unordered sets (i.e. 0..* and 1..* multiplicities) of values MUST be represented as an JSON Array, NOT as a single value.
- Complex types (i.e. not primitive types or derived types) MUST be represented as an JSON Object, NOT as a URI.
- Other values MUST be represented as a JSON String.
- Null values and empty arrays MUST be ommitted from the serialized JSON. This includes empty Arrays.

### A.2 JSON-LD

[JSON-LD] is a JSON-based format used to serialize Linked Data. The syntax is designed to easily integrate into deployed systems already using JSON, and provides a smooth upgrade path from JSON to [JSON-LD]. It is primarily intended to be a way to use Linked Data in Web-based programming environments, to build interoperable Web services, and to store Linked Data in JSON-based storage engines.

Instances of the data model are encoded in [JSON-LD] in the same way they are encoded in JSON (Section § A.1 JSON), with the addition of the `@context` property. The JSON-LD context is described in detail in the [JSON-LD] specification and its use is elaborated on in Section § C. Extending and Profiling the Standard.

Multiple contexts MAY be used or combined to express any arbitrary information about verifiable credentials in idiomatic JSON. The JSON-LD context for all verifiable credentials, available at https://www.w3.org/ns/credentials/v2, is a static document that is never updated and can therefore be downloaded and cached client side. The associated vocabulary document for the Verifiable Credentials Data Model is available at https://www.w3.org/2018/credentials. The JSON-LD context for Open Badges verifiable credentials is available at https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json. The associated vocabulary document for the Open Badges Data Model is available at https://purl.imsglobal.org/spec/vc/ob/vocab.html. Open Badges verifiable credentials MUST be serialized with both JSON-LD contexts.

> **Note**  
> Though this specification requires that a `@context` property be present, it is not required that the value of the `@context` property be processed using JSON-LD. This is to support processing using plain JSON libraries, such as those that might be used when the verifiable credential is encoded as a JWT. All libraries or processors MUST ensure that the order of the values in the `@context` property is what is expected for the specific application. Libraries or processors that support JSON-LD can process the `@context` property using full JSON-LD processing as expected.

**Example 34: JSON-LD @context serialization**
```json
"@context": [
  "https://www.w3.org/ns/credentials/v2",
   "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
]
```
#### A.2.1 Compacted document form

[JSON-LD11-API] defines a compaction process for [JSON-LD11] documents, applying a context to shorten several fields of the document. The purpose of compaction is making the document to be represented in a form that is tailored to the use of the JSON-LD document directly as JSON.

One of the transformations made by this compaction process is representing properties with only one value as string or maps, while properties with multiple values are represented as an array of strings or maps.

The JSON-LD binding for Open Badges verifiable credentials MAY use singular values compaction in some attributes in the data model, such they can be expressed as a string – when having only one value – or an array of strings – when having multiple values.

The properties that may be compacted are listed in the following table:

| Class | Property |
|-------|----------|
| Achievement | type |
| AchievementCredential | type |
| AchievementCredential | credentialSchema |
| AchievementCredential | proof |
| AchievementCredential | termsOfUse |
| AchievementSubject | type |
| Address | type |
| Alignment | type |
| EndorsementCredential | type |
| EndorsementCredential | credentialSchema |
| EndorsementCredential | proof |
| EndorsementCredential | termsOfUse |
| EndorsementSubject | type |
| Evidence | type |
| Profile | type |
| Related | type |
| Result | type |
| ResultDescription | type |
| RubricCriterionLevel | type |
| VerifiableCredential | type |
| VerifiableCredential | proof |
| VerifiableCredential | credentialSchema |
| VerifiableCredential | termsOfUse |

##### A.2.1.1 Schemas

When using the compacted document form, the resulting document MAY not pass canonical JSON Schema files. This MAY end up in an unsuccessful verification of the credential, specially when the `CredentialSchema` property is used. To solve this, JSON Schema files compatible with [JSON-LD11-API] compaction process are available online:

- AchievementCredential JSON schema
- EndorsementCredential JSON schema
- GetOpenBadgeCredentialsResponse JSON schema
- Profile JSON schema
- Imsx_StatusInfo JSON schema

Implementations using `CredentialSchema` MAY rely on this JSON schema files as valid values.

## B. Data Models

### B.1 Credential Data Models

The data models in this section are shared by Open Badges Specification v3.0 and Comprehensive Learner Record Standard v2.0.

#### B.1.1 Achievement

A collection of information about the accomplishment recognized by the Assertion. Many assertions may be created corresponding to one Achievement.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | Unique URI for the Achievement. | [1] |
| type | IRI | The type MUST include the IRI 'Achievement'. | [1..*] |
| alignment | Alignment | An object describing which objectives or educational standards this achievement aligns to, if any. | [0..*] |
| achievementType | AchievementType Enumeration | The type of achievement. This is an extensible vocabulary. | [0..1] |
| creator | Profile | The person or organization that created the achievement definition. | [0..1] |
| creditsAvailable | Float | Credit hours associated with this entity, or credit hours possible. For example 3.0. | [0..1] |
| criteria | Criteria | Criteria describing how to earn the achievement. | [1] |
| description | String | A short description of the achievement. | [1] |
| endorsement | EndorsementCredential | Allows endorsers to make specific claims about the Achievement. These endorsements are signed with a Data Integrity proof format. | [0..*] |
| endorsementJwt | CompactJws | Allows endorsers to make specific claims about the Achievement. These endorsements are signed with the VC-JWT proof format. | [0..*] |
| fieldOfStudy | String | Category, subject, area of study, discipline, or general branch of knowledge. Examples include Business, Education, Psychology, and Technology. | [0..1] |
| humanCode | String | The code, generally human readable, associated with an achievement. | [0..1] |
| image | Image | An image representing the achievement. | [0..1] |
| inLanguage | LanguageCode | The language of the achievement. | [0..1] |
| name | String | The name of the achievement. | [1] |
| otherIdentifier | IdentifierEntry | A list of identifiers for the described entity. | [0..*] |
| related | Related | The related property identifies another Achievement that should be considered the same for most purposes. It is primarily intended to identify alternate language editions or previous versions of Achievements. | [0..*] |
| resultDescription | ResultDescription | The set of result descriptions that may be asserted as results with this achievement. | [0..*] |
| specialization | String | Name given to the focus, concentration, or specific area of study defined in the achievement. Examples include 'Entrepreneurship', 'Technical Communication', and 'Finance'. | [0..1] |
| tag | String | One or more short, human-friendly, searchable, keywords that describe the type of achievement. | [0..*] |
| version | String | The version property allows issuers to set a version string for an Achievement. This is particularly useful when replacing a previous version with an update. | [0..1] |

*This class can be extended with additional properties.*
#### B.1.2 AchievementCredential

AchievementCredentials are representations of an awarded achievement, used to share information about a achievement belonging to one earner. Maps to a Verifiable Credential as defined in the [VC-DATA-MODEL-2.0]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| @context | Context | The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/ns/credentials/v2', and the second item is a URI with the value 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'. | [2..*] |
| id | URI | Unambiguous reference to the credential. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential', and one of the items MUST be the URI 'AchievementCredential' or the URI 'OpenBadgeCredential'. | [1..*] |
| name | String | The name of the credential for display purposes in wallets. For example, in a list of credentials and in detail views. | [0..1] |
| description | String | The short description of the credential for display purposes in wallets. | [0..1] |
| image | Image | The image representing the credential for display purposes in wallets. | [0..1] |
| awardedDate | DateTimeZ | Timestamp of when the credential was awarded. validFrom is used to determine the most recent version of a Credential in conjunction with issuer and id. Consequently, the only way to update a Credental is to update the validFrom, losing the date when the Credential was originally awarded. awardedDate is meant to keep this original date. | [0..1] |
| credentialSubject | AchievementSubject | The recipient of the achievement. | [1] |
| endorsement | EndorsementCredential | Allows endorsers to make specific claims about the credential, and the achievement and profiles in the credential. These endorsements are signed with a Data Integrity proof format. | [0..*] |
| endorsementJwt | CompactJws | Allows endorsers to make specific claims about the credential, and the achievement and profiles in the credential. These endorsements are signed with the VC-JWT proof format. | [0..*] |
| evidence | Evidence | A description of the work that the recipient did to earn the achievement. This can be a page that links out to other pages if linking directly to the work is infeasible. | [0..*] |
| issuer | ProfileRef | A description of the individual, entity, or organization that issued the credential. | [1] |
| validFrom | DateTimeZ | Timestamp of when the credential becomes valid. | [1] |
| validUntil | DateTimeZ | If the credential has some notion of validity period, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered invalid. | [0..1] |
| proof | Proof | If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential. | [0..*] |
| credentialSchema | CredentialSchema | The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema. | [0..*] |
| credentialStatus | CredentialStatus | The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked. | [0..1] |
| refreshService | RefreshService | The information in RefreshService is used to refresh the verifiable credential. | [0..1] |
| termsOfUse | TermsOfUse | The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential. | [0..*] |

*This class can be extended with additional properties.*
#### B.1.3 AchievementSubject

A collection of information about the recipient of an achievement. Maps to Credential Subject in [VC-DATA-MODEL-2.0].

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | An identifier for the Credential Subject. Either id or at least one identifier MUST be supplied. | [0..1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'AchievementSubject'. | [1..*] |
| activityEndDate | DateTime | The datetime the activity ended. | [0..1] |
| activityStartDate | DateTime | The datetime the activity started. | [0..1] |
| creditsEarned | Float | The number of credits earned, generally in semester or quarter credit hours. This field correlates with the Achievement creditsAvailable field. | [0..1] |
| achievement | Achievement | The achievement being awarded. | [1] |
| identifier | IdentityObject | Other identifiers for the recipient of the achievement. Either id or at least one identifier MUST be supplied. | [0..*] |
| image | Image | An image representing this user's achievement. If present, this must be a PNG or SVG image, and should be prepared via the 'baking' instructions. An 'unbaked' image for the achievement is defined in the Achievement class and should not be duplicated here. | [0..1] |
| licenseNumber | String | The license number that was issued with this credential. | [0..1] |
| narrative | Markdown | A narrative that connects multiple pieces of evidence. Likely only present at this location if evidence is a multi-value array. | [0..1] |
| result | Result | The set of results being asserted. | [0..*] |
| role | String | Role, position, or title of the learner when demonstrating or performing the achievement or evidence of learning being asserted. Examples include 'Student President', 'Intern', 'Captain', etc. | [0..1] |
| source | Profile | The person, organization, or system that assessed the achievement on behalf of the issuer. For example, a school may assess the achievement, while the school district issues the credential. | [0..1] |
| term | String | The academic term in which this assertion was achieved. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.4 Address

An address for the described entity.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Address'. | [1..*] |
| addressCountry | String | A country. | [0..1] |
| addressCountryCode | CountryCode | A country code. The value must be a ISO 3166-1 alpha-2 country code [ISO3166-1]. | [0..1] |
| addressRegion | String | A region within the country. | [0..1] |
| addressLocality | String | A locality within the region. | [0..1] |
| streetAddress | String | A street address within the locality. | [0..1] |
| postOfficeBoxNumber | String | A post office box number for PO box addresses. | [0..1] |
| postalCode | String | A postal code. | [0..1] |
| geo | GeoCoordinates | The geographic coordinates of the location. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.5 Alignment

Describes an alignment between an achievement and a node in an educational framework.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Alignment'. | [1..*] |
| targetCode | String | If applicable, a locally unique string identifier that identifies the alignment target within its framework and/or targetUrl. | [0..1] |
| targetDescription | String | Short description of the alignment target. | [0..1] |
| targetName | String | Name of the alignment. | [1] |
| targetFramework | String | Name of the framework the alignment target. | [0..1] |
| targetType | AlignmentTargetType Enumeration | The type of the alignment target node. | [0..1] |
| targetUrl | URL | URL linking to the official description of the alignment target, for example an individual standard within an educational framework. | [1] |

*This class can be extended with additional properties.*

#### B.1.6 Criteria

Descriptive metadata about the achievements necessary to be recognized with an assertion of a particular achievement. This data is added to the Achievement class so that it may be rendered when the achievement assertion is displayed, instead of simply a link to human-readable criteria external to the achievement. Embedding criteria allows either enhancement of an external criteria page or increased portability and ease of use by allowing issuers to skip hosting the formerly-required external criteria page altogether. Criteria is used to allow would-be recipients to learn what is required of them to be recognized with an assertion of a particular achievement. It is also used after the assertion is awarded to a recipient to let those inspecting earned achievements know the general requirements that the recipients met in order to earn it.

> **Note**  
> Implementations SHOULD provide, at least, one of the `id` or `narrative` fields.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The URI of a webpage that describes in a human-readable format the criteria for the achievement. | [0..1] |
| narrative | Markdown | A narrative of what is needed to earn the achievement. Markdown is allowed. | [0..1] |

#### B.1.7 EndorsementCredential

A verifiable credential that asserts a claim about an entity. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| @context | Context | The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/ns/credentials/v2', and the second item is a URI with the value 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'. | [2..*] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential', and one of the items MUST be the URI 'EndorsementCredential'. | [1..*] |
| id | URI | Unambiguous reference to the credential. | [1] |
| name | String | The name of the credential for display purposes in wallets. For example, in a list of credentials and in detail views. | [1] |
| description | String | The short description of the credential for display purposes in wallets. | [0..1] |
| credentialSubject | EndorsementSubject | The individual, entity, organization, assertion, or achievement that is endorsed and the endorsement comment. | [1] |
| awardedDate | DateTimeZ | Timestamp of when the credential was awarded. validFrom is used to determine the most recent version of a Credential in conjunction with issuer and id. Consequently, the only way to update a Credental is to update the validFrom, losing the date when the Credential was originally awarded. awardedDate is meant to keep this original date. | [0..1] |
| issuer | ProfileRef | A description of the individual, entity, or organization that issued the credential. | [1] |
| validFrom | DateTimeZ | Timestamp of when the credential becomes valid. | [1] |
| validUntil | DateTimeZ | If the credential has some notion of validity period, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered invalid. | [0..1] |
| proof | Proof | If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential. | [0..*] |
| credentialSchema | CredentialSchema | The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema. | [0..*] |
| credentialStatus | CredentialStatus | The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked. | [0..1] |
| refreshService | RefreshService | The information in RefreshService is used to refresh the verifiable credential. | [0..1] |
| termsOfUse | TermsOfUse | The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential. | [0..*] |

*This class can be extended with additional properties.*

#### B.1.8 EndorsementSubject

A collection of information about the subject of the endorsement.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The identifier of the individual, entity, organization, assertion, or achievement that is endorsed. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the URI 'EndorsementSubject'. | [1..*] |
| endorsementComment | Markdown | Allows endorsers to make a simple claim in writing about the entity. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.9 Evidence

Descriptive metadata about evidence related to the achievement assertion. Each instance of the evidence class present in an assertion corresponds to one entity, though a single entry can describe a set of items collectively. There may be multiple evidence entries referenced from an assertion. The narrative property is also in scope of the assertion class to provide an overall description of the achievement related to the assertion in rich text. It is used here to provide a narrative of achievement of the specific entity described. If both the description and narrative properties are present, displayers can assume the narrative value goes into more detail and is not simply a recapitulation of description.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The URL of a webpage presenting evidence of achievement or the evidence encoded as a Data URI. The schema of the webpage is undefined. | [0..1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Evidence'. | [1..*] |
| narrative | Markdown | A narrative that describes the evidence and process of achievement that led to an assertion. | [0..1] |
| name | String | A descriptive title of the evidence. | [0..1] |
| description | String | A longer description of the evidence. | [0..1] |
| genre | String | A string that describes the type of evidence. For example, Poetry, Prose, Film. | [0..1] |
| audience | String | A description of the intended audience for a piece of evidence. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.10 GeoCoordinates

The geographic coordinates of a location.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | MUST be the IRI 'GeoCoordinates'. | [1] |
| latitude | Float | The latitude of the location [WGS84]. | [1] |
| longitude | Float | The longitude of the location [WGS84]. | [1] |

*This class can be extended with additional properties.*

#### B.1.11 IdentifierEntry

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | MUST be the IRI 'IdentifierEntry'. | [1] |
| identifier | Identifier | An identifier. | [1] |
| identifierType | IdentifierTypeEnum Enumeration | The identifier type. | [1] |

#### B.1.12 IdentityObject

A collection of information about the recipient of an achievement.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | MUST be the IRI 'IdentityObject'. | [1] |
| hashed | Boolean | Whether or not the identityHash value is hashed. | [1] |
| identityHash | IdentityHash | Either the IdentityHash of the identity or the plaintext value. If it's possible that the plaintext transmission and storage of the identity value would leak personally identifiable information where there is an expectation of privacy, it is strongly recommended that an IdentityHash be used. | [1] |
| identityType | IdentifierTypeEnum Enumeration | The identity type. | [1] |
| salt | String | If the identityHash is hashed, this should contain the string used to salt the hash. If this value is not provided, it should be assumed that the hash was not salted. | [0..1] |

#### B.1.13 Image

Metadata about images that represent assertions, achieve or profiles. These properties can typically be represented as just the id string of the image, but using a fleshed-out document allows for including captions and other applicable metadata.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The URI or Data URI of the image. | [1] |
| type | IRI | MUST be the IRI 'Image'. | [1] |
| caption | String | The caption for the image. | [0..1] |

#### B.1.14 Profile

A Profile is a collection of information that describes the entity or organization using Open Badges. Issuers must be represented as Profiles, and endorsers, or other entities may also be represented using this vocabulary. Each Profile that represents an Issuer may be referenced in many BadgeClasses that it has defined. Anyone can create and host an Issuer file to start issuing Open Badges. Issuers may also serve as recipients of Open Badges, often identified within an Assertion by specific properties, like their url or contact email address.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | Unique URI for the Issuer/Profile file. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Profile'. | [1..*] |
| name | String | The name of the entity or organization. | [0..1] |
| url | URI | The homepage or social media profile of the entity, whether individual or institutional. Should be a URL/URI Accessible via HTTP. | [0..1] |
| phone | PhoneNumber | A phone number. | [0..1] |
| description | String | A short description of the issuer entity or organization. | [0..1] |
| endorsement | EndorsementCredential | Allows endorsers to make specific claims about the individual or organization represented by this profile. These endorsements are signed with a Data Integrity proof format. | [0..*] |
| endorsementJwt | CompactJws | Allows endorsers to make specific claims about the individual or organization represented by this profile. These endorsements are signed with the VC-JWT proof format. | [0..*] |
| image | Image | An image representing the issuer. This must be a PNG or SVG image. | [0..1] |
| email | EmailAddress | An email address. | [0..1] |
| address | Address | An address for the individual or organization. | [0..1] |
| otherIdentifier | IdentifierEntry | A list of identifiers for the described entity. | [0..*] |
| official | String | If the entity is an organization, official is the name of an authorized official of the organization. | [0..1] |
| parentOrg | Profile | The parent organization of the entity. | [0..1] |
| familyName | String | Family name. In the western world, often referred to as the 'last name' of a person. | [0..1] |
| givenName | String | Given name. In the western world, often referred to as the 'first name' of a person. | [0..1] |
| additionalName | String | Additional name. Includes what is often referred to as 'middle name' in the western world. | [0..1] |
| patronymicName | String | Patronymic name. | [0..1] |
| honorificPrefix | String | Honorific prefix(es) preceding a person's name (e.g. 'Dr', 'Mrs' or 'Mr'). | [0..1] |
| honorificSuffix | String | Honorific suffix(es) following a person's name (e.g. 'M.D, PhD'). | [0..1] |
| familyNamePrefix | String | Family name prefix. As used in some locales, this is the leading part of a family name (e.g. 'de' in the name 'de Boer'). | [0..1] |
| dateOfBirth | Date | Birthdate of the person. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.15 Related

Identifies a related achievement.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The related achievement. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Related'. | [1..*] |
| inLanguage | LanguageCode | The language of the related achievement. | [0..1] |
| version | String | The version of the related achievement. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.16 Result

Describes a result that was achieved.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Result'. | [1..*] |
| achievedLevel | URI | If the result represents an achieved rubric criterion level (e.g. Mastered), the value is the id of the RubricCriterionLevel in linked ResultDescription. | [0..1] |
| alignment | Alignment | The alignments between this result and nodes in external frameworks. This set of alignments are in addition to the set of alignments defined in the corresponding ResultDescription object. | [0..*] |
| resultDescription | URI | An achievement can have many result descriptions describing possible results. The value of resultDescription is the id of the result description linked to this result. The linked result description must be in the achievement that is being asserted. | [0..1] |
| status | ResultStatusType Enumeration | The status of the achievement. Required if resultType of the linked ResultDescription is Status. | [0..1] |
| value | String | A string representing the result of the performance, or demonstration, of the achievement. For example, 'A' if the recipient received an A grade in class. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.17 ResultDescription

Describes a possible achievement result.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The unique URI for this result description. Required so a result can link to this result description. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'ResultDescription'. | [1..*] |
| alignment | Alignment | Alignments between this result description and nodes in external frameworks. | [0..*] |
| allowedValue | String | An ordered list of allowed values. The values should be ordered from low to high as determined by the achievement creator. | [0..*] |
| name | String | The name of the result. | [1] |
| requiredLevel | URI | The id of the rubric criterion level required to pass as determined by the achievement creator. | [0..1] |
| requiredValue | String | A value from allowedValue or within the range of valueMin to valueMax required to pass as determined by the achievement creator. | [0..1] |
| resultType | ResultType Enumeration | The type of result this description represents. This is an extensible enumerated vocabulary. | [1] |
| rubricCriterionLevel | RubricCriterionLevel | An ordered array of rubric criterion levels that may be asserted in the linked result. The levels should be ordered from low to high as determined by the achievement creator. | [0..*] |
| valueMax | String | The maximum possible value that may be asserted in a linked result. | [0..1] |
| valueMin | String | The minimum possible value that may be asserted in a linked result. | [0..1] |

*This class can be extended with additional properties.*

#### B.1.18 RubricCriterionLevel

Describes a rubric criterion level.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The unique URI for this rubric criterion level. Required so a result can link to this rubric criterion level. | [1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'RubricCriterionLevel'. | [1..*] |
| alignment | Alignment | Alignments between this rubric criterion level and a rubric criterion levels defined in external frameworks. | [0..*] |
| description | String | Description of the rubric criterion level. | [0..1] |
| level | String | The rubric performance level in terms of success. | [0..1] |
| name | String | The name of the rubric criterion level. | [1] |
| points | String | The points associated with this rubric criterion level. | [0..1] |

*This class can be extended with additional properties.*
#### B.1.19 VerifiableCredential

A Verifiable Credential as defined in the [VC-DATA-MODEL-2.0]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| @context | Context | The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/ns/credentials/v2'. | [1..*] |
| id | URI | Unambiguous reference to the credential. | [0..1] |
| type | IRI | The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential'. | [1..*] |
| issuer | ProfileRef | A description of the individual, entity, or organization that issued the credential. | [1] |
| validFrom | DateTimeZ | Timestamp of when the credential becomes valid. | [1] |
| validUntil | DateTimeZ | If the credential has some notion of validity period, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered invalid. | [0..1] |
| credentialSubject | CredentialSubject | The subject of the credential. | [1] |
| proof | Proof | If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential. | [0..*] |
| credentialSchema | CredentialSchema | The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema. | [0..*] |
| credentialStatus | CredentialStatus | The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked. | [0..1] |
| refreshService | RefreshService | The information in RefreshService is used to refresh the verifiable credential. | [0..1] |
| termsOfUse | TermsOfUse | The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential. | [0..*] |

*This class can be extended with additional properties.*

#### B.1.20 ProfileRef

A description of the individual, entity, or organization that issued the credential. Either a URI with the Unique URI for the Issuer/Profile file, or a Profile object MUST be supplied.

The ultimate representation of this class is a choice of exactly one of the classes in the following set:

| Type | Description |
|------|-------------|
| URI | A NormalizedString that respresents a Uniform Resource Identifier (URI). |
| Profile | A Profile is a collection of information that describes the entity or organization using Open Badges. Issuers must be represented as Profiles, and endorsers, or other entities may also be represented using this vocabulary. Each Profile that represents an Issuer may be referenced in many BadgeClasses that it has defined. Anyone can create and host an Issuer file to start issuing Open Badges. Issuers may also serve as recipients of Open Badges, often identified within an Assertion by specific properties, like their url or contact email address. |

#### B.1.21 CredentialSchema

Identify the type and location of a data schema.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The value MUST be a URI identifying the schema file. One instance of CredentialSchema MUST have an id that is the URL of the JSON Schema for this credential defined by this specification. | [1] |
| type | IRI | The value MUST identify the type of data schema validation. One instance of CredentialSchema MUST have a type of '1EdTechJsonSchemaValidator2019'. | [1] |

*This class can be extended with additional properties.*

#### B.1.22 CredentialStatus

The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked.

| Property | Type | Description | Multiplicity |
|----------|------|-------------|--------------|
| id | URI | The value MUST be the URL of the issuer's credential status method. | [1] |
| type | IRI | The name of the credential status method. | [1] |

*This class can be extended with additional properties.*

#### B.1.23 CredentialSubject

Claims about the credential subject. Maps to Credential Subject as defined in the [VC-DATA-MODEL-2.0].

Property	Type	Description	Multiplicity
id	URI	The identity of the credential subject.	[0..1]
This class can be extended with additional properties.
B.1.24 Proof
A JSON-LD Linked Data proof.

Property	Type	Description	Multiplicity
type	IRI	Signature suite used to produce proof.	[1]
created	DateTime	Date the proof was created.	[0..1]
cryptosuite	String	The suite used to create the proof.	[0..1]
challenge	String	A value chosen by the verifier to mitigate authentication proof replay attacks.	[0..1]
domain	String	The domain of the proof to restrict its use to a particular target.	[0..1]
nonce	String	A value chosen by the creator of proof to randomize proof values for privacy purposes.	[0..1]
proofPurpose	String	The purpose of the proof to be used with verificationMethod. MUST be 'assertionMethod'.	[0..1]
proofValue	String	Value of the proof.	[0..1]
verificationMethod	URI	The URL of the public key that can verify the signature.	[0..1]
This class can be extended with additional properties.
B.1.25 RefreshService
The information in RefreshService is used to refresh the verifiable credential.

Property	Type	Description	Multiplicity
id	URI	The value MUST be the URL of the issuer's refresh service.	[1]
type	IRI	The name of the refresh service method.	[1]
This class can be extended with additional properties.
B.1.26 TermsOfUse
Terms of use can be utilized by an issuer or a holder to communicate the terms under which a verifiable credential or verifiable presentation was issued

Property	Type	Description	Multiplicity
id	URI	The value MUST be a URI identifying the term of use.	[0..1]
type	IRI	The value MUST identify the type of the terms of use.	[1]
This class can be extended with additional properties.
B.1.27 Context
JSON-LD Context. Either a URI with the context definition or a Map with a local context definition MUST be supplied.

The ultimate representation of this class is a choice of exactly one of the classes in the following set:

Type	Description
Map	A map representing an object with unknown, arbitrary properties
URI	A NormalizedString that respresents a Uniform Resource Identifier (URI).
B.1.28 Map
A map representing an object with unknown, arbitrary properties

Property	Type	Description	Multiplicity
This class can be extended with additional properties.
B.1.29 AchievementType Enumeration
The type of achievement, for example 'Award' or 'Certification'. This is an extensible enumerated vocabulary. Extending the vocabulary makes use of a naming convention.

Term	Description
Achievement	Represents a generic achievement.
ApprenticeshipCertificate	Credential earned through work-based learning and earn-and-learn models that meet standards and are applicable to industry trades and professions. This is an exact match of ApprenticeshipCertificate in [CTDL-TERMS].
Assessment	Direct, indirect, formative, and summative evaluation or estimation of the nature, ability, or quality of an entity, performance, or outcome of an action. This is an exact match of Assessment in [CTDL-TERMS].
Assignment	Represents the result of a curricular, or co-curricular assignment or exam.
AssociateDegree	College/university award for students typically completing the first one to two years of post secondary school education. Equivalent to an award at UNESCO ISCED 2011, Level 5. This is an exact match of AssociateDegree in [CTDL-TERMS].
Award	Represents an award.
Badge	Visual symbol containing verifiable claims in accordance with the Open Badges specification and delivered digitally. This is an exact match of Badge in [CTDL-TERMS].
BachelorDegree	College/university award for students typically completing three to five years of education where course work and activities advance skills beyond those of the first one to two years of college/university study. Equivalent to an award at UNESCO ISCED 2011, Level 6. Use for 5-year cooperative (work-study) programs. A cooperative plan provides for alternate class attendance and employment in business, industry, or government; thus, it allows students to combine actual work experience with their college studies. Also includes bachelor's degrees in which the normal 4 years of work are completed in 3 years. This is an exact match of BachelorDegree in [CTDL-TERMS].
Certificate	Credential that designates requisite knowledge and skills of an occupation, profession, or academic program. This is an exact match of Certificate in [CTDL-TERMS].
CertificateOfCompletion	Credential that acknowledges completion of an assignment, training or other activity. A record of the activity may or may not exist, and the credential may or may not be designed as preparation for another resource such as a credential, assessment, or learning opportunity. This is an exact match of CertificateOfCompletion in [CTDL-TERMS].
Certification	Time-limited, revocable, renewable credential awarded by an authoritative body for demonstrating the knowledge, skills, and abilities to perform specific tasks or an occupation. Certifications can typically be revoked if not renewed, for a violation of a code of ethics (if applicable) or proven incompetence after due process. Description of revocation criteria for a specific Certification should be defined using Revocation Profile. This is an exact match of Certification in [CTDL-TERMS].
CommunityService	Represents community service.
Competency	Measurable or observable knowledge, skill, or ability necessary to successful performance of a person. This is an exact match of Competency in [CTDL-ASN-TERMS].
Course	Represents a course completion.
CoCurricular	Represents a co-curricular activity.
Degree	Academic credential conferred upon completion of a program or course of study, typically over multiple years at a college or university. This is an exact match of Degree in [CTDL-TERMS].
Diploma	Credential awarded by educational institutions for successful completion of a course of study or its equivalent. This is an exact match of Diploma in [CTDL-TERMS].
DoctoralDegree	Highest credential award for students who have completed both a bachelor's degree and a master's degree or their equivalent as well as independent research and/or a significant project or paper. Equivalent to UNESCO ISCED, Level 8. This is an exact match of DoctoralDegree in [CTDL-TERMS].
Fieldwork	Represents practical activities that are done away school, college, or place of work. Includes internships and practicums.
GeneralEducationDevelopment	(GED) Credential awarded by examination that demonstrates that an individual has acquired secondary school-level academic skills. Equivalent to a secondary school diploma, based on passing a state- or province-selected examination such as GED, HiSET, or TASC; or to an award at UNESCO ISCED 2011 Levels 2 or 3. This is an exact match of GeneralEducationDevelopment in [CTDL-TERMS].
JourneymanCertificate	Credential awarded to skilled workers on successful completion of an apprenticeship in industry trades and professions. This is an exact match of JourneymanCertificate in [CTDL-TERMS].
LearningProgram	Set of learning opportunities that leads to an outcome, usually a credential like a degree or certificate. This is an exact match of LearningProgram in [CTDL-TERMS].
License	Credential awarded by a government agency or other authorized organization that constitutes legal authority to do a specific job and/or utilize a specific item, system or infrastructure and are typically earned through some combination of degree or certificate attainment, certifications, assessments, work experience, and/or fees, and are time-limited and must be renewed periodically. This is an exact match of License in [CTDL-TERMS].
Membership	Represents membership.
ProfessionalDoctorate	Doctoral degree conferred upon completion of a program providing the knowledge and skills for the recognition, credential, or license required for professional practice. Equivalent to an award at UNESCO ISCED 2011, Level 8. This is an exact match of ProfessionalDoctorate in [CTDL-TERMS].
QualityAssuranceCredential	Credential assuring that an organization, program, or awarded credential meets prescribed requirements and may include development and administration of qualifying examinations. This is an exact match of QualityAssuranceCredential in [CTDL-TERMS].
MasterCertificate	Credential awarded upon demonstration through apprenticeship of the highest level of skills and performance in industry trades and professions. This is an exact match of MasterCertificate in [CTDL-TERMS].
MasterDegree	Credential awarded for a graduate level course of study where course work and activities advance skills beyond those of the bachelor's degree or its equivalent. Equivalent to an award at UNESCO ISCED 2011, Level 7. This is an exact match of MasterDegree in [CTDL-TERMS].
MicroCredential	Credential that addresses a subset of field-specific knowledge, skills, or competencies; often developmental with relationships to other micro-credentials and field credentials. This is an exact match of MicroCredential in [CTDL-TERMS].
ResearchDoctorate	Doctoral degree conferred for advanced work beyond the master level, including the preparation and defense of a thesis or dissertation based on original research, or the planning and execution of an original project demonstrating substantial artistic or scholarly achievement. Equivalent to an award at UNESCO ISCED 2011, Level 8. This is an exact match of ResearchDoctorate in [CTDL-TERMS].
SecondarySchoolDiploma	Diploma awarded by secondary education institutions for successful completion of a secondary school program of study. Equivalent to an award at UNESCO ISCED 2011 Levels 2 or 3. This is an exact match of SecondarySchoolDiploma in [CTDL-TERMS].
This enumeration can be extended with new, proprietary terms. The new terms must start with the substring 'ext:'.
B.1.30 AlignmentTargetType Enumeration
The type of the alignment target node in the target framework.

Term	Description
ceasn:Competency	An alignment to a CTDL-ASN/CTDL competency published by Credential Engine.
ceterms:Credential	An alignment to a CTDL Credential published by Credential Engine.
CFItem	An alignment to a CASE Framework Item.
CFRubric	An alignment to a CASE Framework Rubric.
CFRubricCriterion	An alignment to a CASE Framework Rubric Criterion.
CFRubricCriterionLevel	An alignment to a CASE Framework Rubric Criterion Level.
CTDL	An alignment to a Credential Engine Item.
This enumeration can be extended with new, proprietary terms. The new terms must start with the substring 'ext:'.
B.1.31 IdentifierTypeEnum Enumeration
Term	Description
name	
sourcedId	
systemId	
productId	
userName	
accountId	
emailAddress	
nationalIdentityNumber	
isbn	
issn	
lisSourcedId	
oneRosterSourcedId	
sisSourcedId	
ltiContextId	
ltiDeploymentId	
ltiToolId	
ltiPlatformId	
ltiUserId	
identifier	
This enumeration can be extended with new, proprietary terms. The new terms must start with the substring 'ext:'.
B.1.32 ResultType Enumeration
The type of result. This is an extensible enumerated vocabulary. Extending the vocabulary makes use of a naming convention.

Term	Description
GradePointAverage	The result is a grade point average.
LetterGrade	The result is a letter grade.
Percent	The result is a percent score.
PerformanceLevel	The result is a performance level.
PredictedScore	The result is a predicted score.
RawScore	The result is a raw score.
Result	A generic result.
RubricCriterion	The result is from a rubric criterion.
RubricCriterionLevel	The result is a rubric criterion level.
RubricScore	The result represents a rubric score with both a name and a numeric value.
ScaledScore	The result is a scaled score.
Status	The result conveys the status of the achievement.
This enumeration can be extended with new, proprietary terms. The new terms must start with the substring 'ext:'.
B.1.33 ResultStatusType Enumeration
Defined vocabulary to convey the status of an achievement.

Term	Description
Completed	The learner has successfully completed the achievement. This is the default status if no status result is included.
Enrolled	The learner is enrolled in the activity described by the achievement.
Failed	The learner has unsuccessfully completed the achievement.
InProgress	The learner has started progress in the activity described by the achievement.
OnHold	The learner has completed the activity described by the achievement, but successful completion has not been awarded, typically for administrative reasons.
Provisional	The learner has completed the activity described by the achievement, but the completed result has not yet been confirmed.
Withdrew	The learner withdrew from the activity described by the achievement before completion.
B.2 Open Badges API Data Models
The data models in this section are used by the § 6. Open Badges API.

B.2.1 GetOpenBadgeCredentialsResponse
Property	Type	Description	Multiplicity
credential	AchievementCredential	OpenBadgeCredentials that have not been signed with the VC-JWT Proof Format MUST be in the credential array.	[0..*]
compactJwsString	CompactJws	OpenBadgeCredentials that have been signed with the VC-JWT Proof Format MUST be in the compactJwsString array.	[0..*]
B.3 Shared API Data Models
The data models in this section are shared by all 1EdTech service specifications.

B.3.1 Imsx_StatusInfo
This is the container for the status code and associated information returned within the HTTP messages received from the Service Provider.

Property	Type	Description	Multiplicity
imsx_codeMajor	Imsx_CodeMajor Enumeration	The code major value (from the corresponding enumerated vocabulary).	[1]
imsx_severity	Imsx_Severity Enumeration	The severity value (from the corresponding enumerated vocabulary).	[1]
imsx_description	String	A human readable description supplied by the entity creating the status code information.	[0..1]
imsx_codeMinor	Imsx_CodeMinor	The set of reported code minor status codes.	[0..1]
B.3.2 Imsx_CodeMajor Enumeration
This is the set of primary status report values i.e. the major code assigned to the status block. This is used in conjunction with the 'Severity' structure in the status object.

Term	Description
failure	Denotes that the transaction request has failed. The detailed reason will be reported in the accompanying 'codeMinor' fields.
processing	Denotes that the request is being processed at the destination or there has been a local transmission failure. This value is used in asynchronous services.
success	Denotes that the request has been successfully completed. If the associated 'severity' value is 'warning' then the request has been partially successful i.e. best effort by the service provider. Other parts of the status information may provide more insight into a partial success response.
unsupported	Denotes that the service provider does not support the requested operation. This is the required default response for an unsupported operation by an implementation.
B.3.3 Imsx_Severity Enumeration
This is the context for the status report values. This is used in conjunction with the 'CodeMajor' structure in the status object.

Term	Description
error	A catastrophic error has occurred in processing the request and so the request was not completed (the Service Provider may not even have received the request).
status	The request has been completed and a response was received from the Service Provider.
warning	The request has only been partially completed. For an asynchronous service a further response should be expected.
B.3.4 Imsx_CodeMinor
This is the container for the set of code minor status codes reported in the responses from the Service Provider.

Property	Type	Description	Multiplicity
imsx_codeMinorField	Imsx_CodeMinorField	Each reported code minor status code.	[1..*]
B.3.5 Imsx_CodeMinorField
This is the container for a single code minor status code.

Property	Type	Description	Multiplicity
imsx_codeMinorFieldName	NormalizedString	This should contain the identity of the system that has produced the code minor status code report.	[1]
imsx_codeMinorFieldValue	Imsx_CodeMinorFieldValue Enumeration	The code minor status code (this is a value from the corresponding enumerated vocabulary).	[1]
B.3.6 Imsx_CodeMinorFieldValue Enumeration
This is the set of codeMinor status codes that are used to provide further insight into the completion status of the end-to-end transaction i.e. this should be used to provide more information than would be supplied by an HTTP code.

Term	Description
forbidden	This is used to indicate that the server can be reached and process the request but refuses to take any further action. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '403'.
fullsuccess	The request has been fully and successfully implemented by the service provider. For a REST binding this will have an HTTP code of '200' for a successful search request.
internal_server_error	This should be used only if there is catastrophic error and there is not a more appropriate code. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '500'.
invalid_data	This error condition may occur if a JSON request/response body contains well-formed (i.e. syntactically correct), but semantically erroneous, JSON instructions. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and a HTTP code of '422'.
invalid_query_parameter	An invalid data query parameter field was supplied and the query could not be processed. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '400'.
misdirected_request	This is used to indicate that the request was made with a protocol that is not supported by the server. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '421'.
not_acceptable	This is used to indicate that the server cannot provide a response with a Content-Type that matches any of the content types in the request Accept header. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '406'.
not_allowed	This is used to indicate that the server does not allow the HTTP method. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '405'.
not_found	This is used to indicate that the server did not find the resource. This would be accompanied by the 'codeMajor/severity' values of 'failure/status' and for a REST binding a HTTP code of '404'.
not_modified	This is used to indicate that the server did not modify the resource. This would be accompanied by the 'codeMajor/severity' values of 'success/status' and for a REST binding a HTTP code of '304'.
server_busy	The server is receiving too many requests. Retry at a later time. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '429'.
unauthorizedrequest	The request was not correctly authorised. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code of '401'.
unknown	Any other error occurred. This would be accompanied by the 'codeMajor/severity' values of 'failure/error' and for a REST binding a HTTP code corresponding to the error.
B.4 Shared API Security Data Models
The data models in this section are shared by all 1EdTech service specifications.

B.4.1 ServiceDescriptionDocument
The Service Description Document (SDD) is a machine readable document that contains the description of the service features supported by the Provider/Platform. The SDD is an OpenAPI 3.0 (JSON) [OPENAPIS-3.0] structured document that MUST be a profiled version of the OpenAPI 3.0 (JSON) file provided provided with this specification. This profiled version contains all of the details about the supported set of service end-points, the supported optional data fields, definitions of the proprietary data fields supplied using the permitted extension mechanisms, definitions of the available proprietary endpoints, and information about the security mechanisms.

Note
Only a subset of the object properties are shown here.
Property	Type	Description	Multiplicity
openapi	String	This string MUST be the semantic version number of the OpenAPI Specification version that the OpenAPI document uses. The openapi field SHOULD be used by tooling specifications and clients to interpret the OpenAPI document. This is not related to the API info.version string.	[1]
info	OpenApiInfo	Information about the API and the resource server.
Note
The proprietary fields x-imssf-image and x-imssf-privacyPolicyUrl are found here.
[1]
components	OpenApiComponents	Holds a set of reusable objects for different aspects of the OAS.
Note
The proprietary field x-imssf-registrationUrl is found in the securitySchemes components.
[1]
This class can be extended with additional properties.
B.4.2 OpenApiComponents
Holds a set of reusable objects for different aspects of the OAS. All objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object.

Note
Only a subset of the object properties are shown here.
Property	Type	Description	Multiplicity
securitySchemes	OpenApiSecuritySchemes	The Map of security scheme objects supported by this specification.	[1]
This class can be extended with additional properties.
B.4.3 OpenApiInfo
The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.

Note
Only a subset of the object properties are shown here.
Property	Type	Description	Multiplicity
termsOfService	URL	A fully qualified URL to the resource server's terms of service.	[1]
title	String	The name of the resource server.	[1]
version	String	The version of the API.	[1]
x-imssf-image	URI	An image representing the resource server. MAY be a Data URI or the URL where the image may be found.	[0..1]
x-imssf-privacyPolicyUrl	URL	A fully qualified URL to the resource server's privacy policy.	[1]
This class can be extended with additional properties.
B.4.4 OpenApiOAuth2SecurityScheme
Defines an OAuth2 security scheme that can be used by the operations.

Note
Only a subset of the object properties are shown here.
Property	Type	Description	Multiplicity
type	String	MUST be the string oauth2.	[1]
description	String	A short description for the security scheme.	[0..1]
x-imssf-registrationUrl	URL	A fully qualified URL to the Client Registration endpoint.	[1]
This class can be extended with additional properties.
B.4.5 OpenApiSecuritySchemes
The Map of security scheme objects supported by this specification.

Note
Only a subset of the object properties are shown here.
Property	Type	Description	Multiplicity
OAuth2ACG	OpenApiOAuth2SecurityScheme	REQUIRED if the authorization server supports the Authorization Code Grant Flow.	[0..1]
B.5 Shared OAuth 2.0 Data Models
The data models in this section are shared by all 1EdTech service specifications.

B.5.1 AuthorizationError Vocabulary
This is the set of ASCII error code strings that may be returned in response to a client authorization request. See Section 4.1 of [RFC6749].

Term	Description
invalid_request	The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.
unauthorized_client	The client is not authorized to request an authorization code using this method.
access_denied	The resource owner or authorization server denied the request.
unsupported_response_type	The authorization server does not support obtaining an authorization code using this method.
invalid_scope	The requested scope is invalid, unknown, or malformed.
server_error	The authorization server encountered an unexpected condition that prevented it from fulfilling the request. (This error code is needed because a 500 Internal Server Error HTTP status code cannot be returned to the client via an HTTP redirect.)
temporarily_unavailable	The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server. (This error code is needed because a 503 Service Unavailable HTTP status code cannot be returned to the client via an HTTP redirect.)
B.5.2 RegistrationError Vocabulary
This is the set of ASCII error code strings that may be returned in response to a client registration request. See [RFC7591].

Term	Description
invalid_redirect_uri	The value of one or more redirection URIs is invalid.
invalid_client_metadata	The value of one of the client metadata fields is invalid and the server has rejected this request. Note that an authorization server MAY choose to substitute a valid value for any requested parameter of a client's metadata.
invalid_software_statement	The software statement presented is invalid. This MUST only be returned if a Software Statement has been supplied in the registration request. Use of a Software Statement is NOT RECOMMENDED.
unapproved_software_statement	The software statement presented is not approved for use by this authorization server. This MUST only be returned if a Software Statement has been supplied in the registration request. Use of a Software Statement is NOT RECOMMENDED.
B.5.3 TokenError Vocabulary
This is the set of ASCII error code strings that may be returned in response to a client token request. See Section 5.2 of [RFC6749].

Term	Description
invalid_request	The request is missing a required parameter, includes an unsupported parameter value (other than grant type), repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client, or is otherwise malformed.
invalid_client	Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method). The authorization server MAY return an HTTP 401 (Unauthorized) status code to indicate which HTTP authentication schemes are supported. If the client attempted to authenticate via the "Authorization" request header field, the authorization server MUST respond with an HTTP 401 (Unauthorized) status code and include the "WWW-Authenticate" response header field matching the authentication scheme used by the client.
invalid_grant	The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.
unauthorized_client	The authenticated client is not authorized to use this authorization grant type.
unsupported_grant_type	The authorization grant type is not supported by the authorization server.
unsupported_token_type	The authorization server does not support the revocation of the presented token type. That is, the client tried to revoke an access token on a server not supporting this feature.
invalid_scope	The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.
B.6 Shared Proof Data Models
Data models for the JSON Web Token Proof Format (VC-JWT) [VC-DATA-MODEL-2.0] shared by Open Badges Specification v3.0 and Comprehensive Learner Record Standard v2.0.

B.6.1 Multikey
Property	Type	Description	Multiplicity
id	URI	The id of the verification method MUST be the JWK thumbprint calculated from the publicKeyMultibase property value according to [MULTIBASE].	[1]
type	String	The type of the verification method MUST be the string DataIntegrityProof.	[0..1]
cryptosuite	String	The cryptosuite of the verification method MUST be the string eddsa-rdf-2022.	[1]
controller	URI	The identify of the entity that controls this public key.	[0..1]
publicKeyMultibase	String	The publicKeyMultibase property of the verification method MUST be a public key encoded according to [MULTICODEC] and formatted according to [MULTIBASE]. The multicodec encoding of a Ed25519 public key is the two-byte prefix 0xed01 followed by the 32-byte public key data.	[1]
B.6.2 JWK
A JSON Web Key (JWK) formatted according to [RFC7517].

Property	Type	Description	Multiplicity
kty	String	The kty (key type) parameter identifies the cryptographic algorithm family used with the key, such as RSA or EC.	[1]
use	String	The use (public key use) parameter identifies the intended use of the public key, such as sig (signature) or end (encryption).	[0..1]
key_ops	String	The key_ops (key operations) parameter identifies the operation(s) for which the key is intended to be used, such as sign (compute digital signature or MAC) or verify (verify digital signature or MAC).	[0..1]
alg	String	The alg (algorithm) parameter identifies the algorithm intended for use with the key, such as RS256 or PS256.	[0..1]
kid	String	The kid (key ID) parameter is used to match a specific key.	[0..1]
x5u	URI	The x5u (X.509 URL) parameter is a URI that refers to a resource for an X.509 public key certificate or certificate chain [RFC5280].	[0..1]
x5c	String	The x5c (X.509 certificate chain) parameter contains a chain of one or more PKIX certificates [RFC5280].	[0..*]
x5t	String	The x5t (X.509 certificate SHA-1 thumbprint) parameter is a base64url-encoded SHA-1 thumbprint (a.k.a. digest) of the DER encoding of an X.509 certificate [RFC5280].	[0..1]
x5t_S256	String	The x5t#S256 (X.509 certificate SHA-256 thumbprint) parameter is a base64url-encoded SHA-256 thumbprint (a.k.a. digest) of the DER encoding of an X.509 certificate [RFC5280].	[0..1]
This class can be extended with additional properties.
B.6.3 JWKS
A JWK Set (JWKS) formatted according to [RFC7517].

Property	Type	Description	Multiplicity
keys	JWK	A JWK Set is a JSON object that represents a set of JWKs.	[1..*]
B.7 Derived Types
The derived types in this section are shared by all 1EdTech specifications.

Type	Description
ASCIIString	An ASCII [RFC20] string. The string MUST NOT include characters outside the set %x20-21 / %x23-5B / %x5D-7E.
BaseTerm	A term in an enumeration which serves as a common term for all other entries in this enumeration, and as such is less specific. The lexical constraints are the same as for Term.
CompactJws	A String in Compact JWS format [RFC7515].
CountryCode	A two-digit ISO 3166-1 alpha-2 country code [ISO3166-1].
DateTimeZ	A DateTime with the trailing timezone specifier included, e.g. 2021-09-07T02:09:59+02:00
EmailAddress	A NormalizedString representing an email address.
Identifier	A NormalizedString that functions as an identifier.
IdentityHash	A String consisting of an algorithm identifier, a $ separator, and a hash across an identifier and an optionally appended salt string. The only supported algorithms are MD5 [RFC1321] and SHA-256 [FIPS-180-4], identified by the strings 'md5' and 'sha256' respectively. Identifiers and salts MUST be encoded in UTF-8 prior to hashing, and the resulting hash MUST be expressed in hexadecimal using uppercase (A-F, 0-9) or lowercase character (a-f, 0-9) sets. For example: 'sha256$b5809d8a92f8858436d7e6b87c12ebc0ae1eac4baecc2c0b913aee2c922ef399' represents the result of calculating a SHA-256 hash on the string 'a@example.comKosher'. in which the email identifier 'a@example.com' is salted with 'Kosher'
IRI	A NormalizedString that represents an Internationalized Resource Identifier (IRI), which extends the ASCII characters subset of the Uniform Resource Identifier (URI).
LanguageCode	A language code [BCP47].
Markdown	A String that may contain Markdown.
NumericDate	An Integer representing the number of seconds from from 1970-01-01T00:00:00Z UTC until the specified UTC data/time, ignoring leap seconds.
PhoneNumber	A NormalizedString representing a phone number.
Term	A term in an enumeration. The lexical constraints are the same as for Token.
URI	A NormalizedString that respresents a Uniform Resource Identifier (URI).
URL	A URI that represents a Uniform Resource Locator (URL).
UUID	An Identifier with the lexical restrictions of a UUID [RFC4122]
B.8 Primitive Types
The primitive types in this section are shared by all 1EdTech specifications.

Type	Description
Boolean	A boolean, expressed as true or false
Date	An [ISO8601] calendar date using the syntax YYYY-MM-DD.
DateTime	An [ISO8601] time using the syntax YYYY-MM-DDThh:mm:ss.
Float	
Integer	
Language	A language code [BCP47].
Namespace	A namespace data type for defining data from a context other than that as the default for the data model. This is used for importing other data models.
NonNegativeInteger	
NormalizedString	A String conforming to the normalizedString definition in [XMLSCHEMA-2].
PositiveInteger	
String	Character strings.
B.9 Verification Support Data Models
The data models in this section are used by the § 9. Verification and Validation process for supporting older credentials created with [VC-DATA-MODEL].

B.9.1 AnyAchievementCredential
AnyAchievementCredential represents an AchievementCredential that might be built using [VC-DATA-MODEL] or [VC-DATA-MODEL-2.0]. The scope of this class is only for verification purposes. It is not intended to be used in the creation of new credentials, where the § B.1.2 AchievementCredential class MUST be used.

The ultimate representation of this class is a choice of exactly one of the classes in the following set:

Type	Description
AchievementCredential	AchievementCredentials are representations of an awarded achievement, used to share information about a achievement belonging to one earner. Maps to a Verifiable Credential as defined in the [VC-DATA-MODEL-2.0]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.
AchievementCredentialv1p1	AchievementCredentials are representations of an awarded achievement, used to share information about a achievement belonging to one earner. Maps to a Verifiable Credential as defined in the [VC-DATA-MODEL]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.
B.9.2 AchievementCredentialv1p1
AchievementCredentials are representations of an awarded achievement, used to share information about a achievement belonging to one earner. Maps to a Verifiable Credential as defined in the [VC-DATA-MODEL]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

Property	Type	Description	Multiplicity
@context	Context	The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/2018/credentials/v1', and the second item is a URI with the value 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'.	[2..*]
id	URI	Unambiguous reference to the credential.	[1]
type	IRI	The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential', and one of the items MUST be the URI 'AchievementCredential' or the URI 'OpenBadgeCredential'.	[1..*]
name	String	The name of the credential for display purposes in wallets. For example, in a list of credentials and in detail views.	[1]
description	String	The short description of the credential for display purposes in wallets.	[0..1]
image	Image	The image representing the credential for display purposes in wallets.	[0..1]
awardedDate	DateTimeZ	Timestamp of when the credential was awarded. validFrom is used to determine the most recent version of a Credential in conjunction with issuer and id. Consequently, the only way to update a Credental is to update the validFrom, losing the date when the Credential was originally awarded. awardedDate is meant to keep this original date.	[0..1]
credentialSubject	AchievementSubjectv1p1	The recipient of the achievement.	[1]
endorsement	EndorsementCredentialv1p1	Allows endorsers to make specific claims about the credential, and the achievement and profiles in the credential. These endorsements are signed with a Data Integrity proof format.	[0..*]
endorsementJwt	CompactJws	Allows endorsers to make specific claims about the credential, and the achievement and profiles in the credential. These endorsements are signed with the VC-JWT proof format.	[0..*]
evidence	Evidence		[0..*]
issuer	Profilev1p1	A description of the individual, entity, or organization that issued the credential.	[1]
issuanceDate	DateTimeZ	Timestamp of when the credential was issued.	[1]
expirationDate	DateTimeZ	If the credential has some notion of expiry, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered expired.	[0..1]
proof	Proof	If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential.	[0..*]
credentialSchema	CredentialSchema	The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema.	[0..*]
credentialStatus	CredentialStatus	The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked.	[0..1]
refreshService	RefreshService	The information in RefreshService is used to refresh the verifiable credential.	[0..1]
termsOfUse	TermsOfUse	The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential.	[0..*]
This class can be extended with additional properties.
B.9.3 AnyEndorsementCredential
AnyEndorsementCredential represents an EndorsementCredential that might be built using [VC-DATA-MODEL] or [VC-DATA-MODEL-2.0]. The scope of this class is only for verification purposes. It is not intended to be used in the creation of new credentials, where the [[[#endorsementcredential]] class MUST be used.

The ultimate representation of this class is a choice of exactly one of the classes in the following set:

Type	Description
EndorsementCredential	A verifiable credential that asserts a claim about an entity. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.
EndorsementCredentialv1p1	A verifiable credential that asserts a claim about an entity. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.
B.9.4 EndorsementCredentialv1p1
A verifiable credential that asserts a claim about an entity. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

Property	Type	Description	Multiplicity
@context	Context	The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/2018/credentials/v1', and the second item is a URI with the value 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'.	[2..*]
type	IRI	The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential', and one of the items MUST be the URI 'EndorsementCredential'.	[1..*]
id	URI	Unambiguous reference to the credential.	[1]
name	String	The name of the credential for display purposes in wallets. For example, in a list of credentials and in detail views.	[1]
description	String	The short description of the credential for display purposes in wallets.	[0..1]
credentialSubject	EndorsementSubject	The individual, entity, organization, assertion, or achievement that is endorsed and the endorsement comment.	[1]
awardedDate	DateTimeZ	Timestamp of when the credential was awarded. validFrom is used to determine the most recent version of a Credential in conjunction with issuer and id. Consequently, the only way to update a Credental is to update the validFrom, losing the date when the Credential was originally awarded. awardedDate is meant to keep this original date.	[0..1]
issuer	Profilev1p1	A description of the individual, entity, or organization that issued the credential.	[1]
issuanceDate	DateTimeZ	Timestamp of when the credential was issued.	[1]
expirationDate	DateTimeZ	If the credential has some notion of expiry, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered expired.	[0..1]
proof	Proof	If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential.	[0..*]
credentialSchema	CredentialSchema	The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema.	[0..*]
credentialStatus	CredentialStatus	The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked.	[0..1]
refreshService	RefreshService	The information in RefreshService is used to refresh the verifiable credential.	[0..1]
termsOfUse	TermsOfUse	The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential.	[0..*]
This class can be extended with additional properties.
B.9.5 VerifiableCredentialv1p1
A Verifiable Credential as defined in the [VC-DATA-MODEL]. As described in § 8. Proofs (Signatures), at least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential to be a verifiable credential. In the case of an embedded proof, the credential MUST append the proof in the proof property.

Property	Type	Description	Multiplicity
@context	Context	The value of the @context property MUST be an ordered set where the first item is a URI with the value 'https://www.w3.org/2018/credentials/v1'.	[1..*]
id	URI	Unambiguous reference to the credential.	[0..1]
type	IRI	The value of the type property MUST be an unordered set. One of the items MUST be the URI 'VerifiableCredential'.	[1..*]
issuer	Profilev1p1	A description of the individual, entity, or organization that issued the credential.	[1]
issuanceDate	DateTimeZ	Timestamp of when the credential was issued.	[1]
expirationDate	DateTimeZ	If the credential has some notion of expiry, this indicates a timestamp when a credential should no longer be considered valid. After this time, the credential should be considered expired.	[0..1]
credentialSubject	CredentialSubject	The subject of the credential.	[1]
proof	Proof	If present, one or more embedded cryptographic proofs that can be used to detect tampering and verify the authorship of the credential.	[0..*]
credentialSchema	CredentialSchema	The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema.	[0..*]
credentialStatus	CredentialStatus	The information in CredentialStatus is used to discover information about the current status of a verifiable credential, such as whether it is suspended or revoked.	[0..1]
refreshService	RefreshService	The information in RefreshService is used to refresh the verifiable credential.	[0..1]
termsOfUse	TermsOfUse	The value of the termsOfUse property tells the verifier what actions it is required to perform (an obligation), not allowed to perform (a prohibition), or allowed to perform (a permission) if it is to accept the verifiable credential.	[0..*]
This class can be extended with additional properties.
B.9.6 AchievementSubjectv1p1
A collection of information about the recipient of an achievement. Maps to Credential Subject in [VC-DATA-MODEL-2.0].

Property	Type	Description	Multiplicity
id	URI	An identifier for the Credential Subject. Either id or at least one identifier MUST be supplied.	[0..1]
type	IRI	The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'AchievementSubject'.	[1..*]
activityEndDate	DateTime	The datetime the activity ended.	[0..1]
activityStartDate	DateTime	The datetime the activity started.	[0..1]
creditsEarned	Float	The number of credits earned, generally in semester or quarter credit hours. This field correlates with the Achievement creditsAvailable field.	[0..1]
achievement	Achievementv1p1	The achievement being awarded.	[1]
identifier	IdentityObject	Other identifiers for the recipient of the achievement. Either id or at least one identifier MUST be supplied.	[0..*]
image	Image	An image representing this user's achievement. If present, this must be a PNG or SVG image, and should be prepared via the 'baking' instructions. An 'unbaked' image for the achievement is defined in the Achievement class and should not be duplicated here.	[0..1]
licenseNumber	String	The license number that was issued with this credential.	[0..1]
narrative	Markdown	A narrative that connects multiple pieces of evidence. Likely only present at this location if evidence is a multi-value array.	[0..1]
result	Result	The set of results being asserted.	[0..*]
role	String	Role, position, or title of the learner when demonstrating or performing the achievement or evidence of learning being asserted. Examples include 'Student President', 'Intern', 'Captain', etc.	[0..1]
source	Profilev1p1	The person, organization, or system that assessed the achievement on behalf of the issuer. For example, a school may assess the achievement, while the school district issues the credential.	[0..1]
term	String	The academic term in which this assertion was achieved.	[0..1]
B.9.7 Achievementv1p1
A collection of information about the accomplishment recognized by the Assertion. Many assertions may be created corresponding to one Achievement.

Property	Type	Description	Multiplicity
id	URI	Unique URI for the Achievement.	[1]
type	IRI		[1..*]
alignment	Alignment	An object describing which objectives or educational standards this achievement aligns to, if any.	[0..*]
achievementType	AchievementType Enumeration	The type of achievement. This is an extensible vocabulary.	[0..1]
creator	Profilev1p1	The person or organization that created the achievement definition.	[0..1]
creditsAvailable	Float	Credit hours associated with this entity, or credit hours possible. For example 3.0.	[0..1]
criteria	Criteria	Criteria describing how to earn the achievement.	[1]
description	String	A short description of the achievement.	[1]
endorsement	EndorsementCredentialv1p1	Allows endorsers to make specific claims about the Achievement. These endorsements are signed with a Data Integrity proof format.	[0..*]
endorsementJwt	CompactJws	Allows endorsers to make specific claims about the Achievement. These endorsements are signed with the VC-JWT proof format.	[0..*]
fieldOfStudy	String	Category, subject, area of study, discipline, or general branch of knowledge. Examples include Business, Education, Psychology, and Technology.	[0..1]
humanCode	String	The code, generally human readable, associated with an achievement.	[0..1]
image	Image	An image representing the achievement.	[0..1]
inLanguage	LanguageCode	The language of the achievement.	[0..1]
name	String	The name of the achievement.	[1]
otherIdentifier	IdentifierEntry	A list of identifiers for the described entity.	[0..*]
related	Related	The related property identifies another Achievement that should be considered the same for most purposes. It is primarily intended to identify alternate language editions or previous versions of Achievements.	[0..*]
resultDescription	ResultDescription	The set of result descriptions that may be asserted as results with this achievement.	[0..*]
specialization	String	Name given to the focus, concentration, or specific area of study defined in the achievement. Examples include 'Entrepreneurship', 'Technical Communication', and 'Finance'.	[0..1]
tag	String	One or more short, human-friendly, searchable, keywords that describe the type of achievement.	[0..*]
version	String	The version property allows issuers to set a version string for an Achievement. This is particularly useful when replacing a previous version with an update.	[0..1]
This class can be extended with additional properties.
B.9.8 Profilev1p1
A Profile is a collection of information that describes the entity or organization using Open Badges. Issuers must be represented as Profiles, and endorsers, or other entities may also be represented using this vocabulary. Each Profile that represents an Issuer may be referenced in many BadgeClasses that it has defined. Anyone can create and host an Issuer file to start issuing Open Badges. Issuers may also serve as recipients of Open Badges, often identified within an Assertion by specific properties, like their url or contact email address.

Property	Type	Description	Multiplicity
id	URI	Unique URI for the Issuer/Profile file.	[1]
type	IRI	The value of the type property MUST be an unordered set. One of the items MUST be the IRI 'Profile'.	[1..*]
name	String	The name of the entity or organization.	[0..1]
url	URI	The homepage or social media profile of the entity, whether individual or institutional. Should be a URL/URI Accessible via HTTP.	[0..1]
phone	PhoneNumber	A phone number.	[0..1]
description	String	A short description of the issuer entity or organization.	[0..1]
endorsement	EndorsementCredentialv1p1	Allows endorsers to make specific claims about the individual or organization represented by this profile. These endorsements are signed with a Data Integrity proof format.	[0..*]
endorsementJwt	CompactJws	Allows endorsers to make specific claims about the individual or organization represented by this profile. These endorsements are signed with the VC-JWT proof format.	[0..*]
image	Image	An image representing the issuer. This must be a PNG or SVG image.	[0..1]
email	EmailAddress	An email address.	[0..1]
address	Address	An address for the individual or organization.	[0..1]
otherIdentifier	IdentifierEntry	A list of identifiers for the described entity.	[0..*]
official	String	If the entity is an organization, official is the name of an authorized official of the organization.	[0..1]
parentOrg	Profile	The parent organization of the entity.	[0..1]
familyName	String	Family name. In the western world, often referred to as the 'last name' of a person.	[0..1]
givenName	String	Given name. In the western world, often referred to as the 'first name' of a person.	[0..1]
additionalName	String	Additional name. Includes what is often referred to as 'middle name' in the western world.	[0..1]
patronymicName	String	Patronymic name.	[0..1]
honorificPrefix	String	Honorific prefix(es) preceding a person's name (e.g. 'Dr', 'Mrs' or 'Mr').	[0..1]
honorificSuffix	String	Honorific suffix(es) following a person's name (e.g. 'M.D, PhD').	[0..1]
familyNamePrefix	String	Family name prefix. As used in some locales, this is the leading part of a family name (e.g. 'de' in the name 'de Boer').	[0..1]
dateOfBirth	Date	Birthdate of the person.	[0..1]
This class can be extended with additional properties.
C. Extending and Profiling the Standard
This standard can be extended in three ways:

Extend the Data Model with new classes and new properties to existing extensible classes
Extend the Extensible Enumerated Vocabularies in the Data Model
Extend the API with new endpoints and new responses to existing endpoints
Extensions SHOULD be presented to the Comprehensive Learner Record project group for review and socialization.

Extensions MUST NOT be required.

Extensions WILL NOT be tested during conformance testing.

This standard can also be profiled. In general, profiling is used to:

Refine which endpoints are used and which operations are supported for each endpoint
Refine the data models by increasing the constraints on the base definitions
### C.1 Extending the Data Model

A data model extension may add new classes to the Data Model and/or new properties to existing extensible classes. Extensible classes are identified by the phrase, "This class can be extended with additional properties" shown at the bottom of the table of properties. For example, the Alignment class is extensible.

The extension SHOULD be documented with the following artifacts:

- A description of the extension and the problem it solves. Ideally the description would include a use case formatted like the use cases in this specification.
- Definitions of the new classes being introduced. Each definition MUST include the class name, description, and properties; and indicate whether the class can be extended.
- Definitions of the new properties being introduced. The each definition MUST include the property name, type, and description; and indicate whether the property is required.
- A JSON Schema file that defines the new classes and/or properties. The JSON Schema file MUST be hosted on a publicly accessible server with no CORS restrictions.
- A JSON-LD Context file that defines the new classes and/or properties. The context file MUST be hosted on a publically accessible server with no CORS restrictions.
- Ideally a modified version of the CLR Standard OpenAPI file that includes the new classes and/or properties.

To use the extension implementers MUST do the following:

- Include the JSON-LD Context file URL in the `@context` property. See Serialization.
- Include the JSON Schema file URL in the `credentialSchema` property.
### C.2 Extending Enumerated Vocabularies

All extensible enumerated vocabularies may be extended with custom terms. Extensible vocabularies are identified by the phrase, "This enumeration can be extended with new, proprietary terms" shown at the bottom of the table of terms. For example, the AchivementType enumeration is extensible.

Extended terms MUST start with the prefix `"ext:"`. For example, `"ext:MyTerm"`.

The extended terms SHOULD be documented with the following artifacts:

- A description of the extension and the problem it solves. Ideally the description would include a use case formatted like the use cases in this specification.
- Definitions of each extended term. Each definition MUST include the extended term (e.g. `"ext:MyTerm"`) and description.
- A JSON Schema file is not required. The existing JSON Schema for extensible vocabularies allows extended terms that follow the naming rule above.
- You MAY include a JSON-LD Context file that defines the new extended terms. If one is supplied, it MUST be hosted on a publically accessible server with no CORS restrictions.

To use the extended vocabulary implementers MAY do the following:

- Include the JSON-LD Context file URL in the `@context` property. See Serialization.
### C.3 Extending the API

An API extension may add new endpoints (with or without new scopes) to the CLR Standard API and/or new responses to the existing endpoints.

The extension SHOULD be documented with the following artifacts:

- A description of the extension and the problem it solves. Ideally the description would include a use case formatted like the use cases in this specification.
- Definitions of the new endpoints being introduced. Each definition MUST include the endpoint name, description, HTTP Method, URL format, required request query parameters (if any), required request headers, required request payload (if any), required responses, and required response headers.
  - The URL format MUST following 1EdTech naming conventions. Specifically, the path `"/ims/clr/v2p0/"` must precede the final URL segment. For example, `"/ims/clr/v2p0/myendpoint"`.
  - The definition must indicate if the endpoint requires authorization. If it does, the definition must define the scope that is required. New endpoints that require authorization MUST follow the requirements shown in CLR Standard API Security.
  - Each required query parameter definition MUST include the parameter type and description.
  - Each required request header definition MUST include the header and a description.
  - A required request payload definition MUST include the payload type.
  - Each required request response definition MUST include the HTTP Status Code, payload type (if any), and description. Non-successful responses (i.e. HTTP Status Code >= 400) SHOULD use the `Imsx_StatusInfo` payload.
  - Each requied response header defintion MUST include the header and a description.
- Definitions of the new responses to existing endpoints. The each definition MUST include the HTTP Status Code, payload type (if any), and description. Non-successful responses (i.e. HTTP Status Code >= 400) SHOULD use the `Imsx_StatusInfo` payload.
- Ideally an OpenAPI file that describes the new endpoints and/or responses to existing endpoints.
### C.4 Profiles

Profiling is the process by which an 1EdTech specification is tailored to meet the requirements of a specific community: the community could be a reflection of a market sector, a geographic location, etc. An example of such a community is the Norwegian K-12/Schools for whom a profile of the 1EdTech OneRoster 1.2 specification has been created. The process of profiling starts with the corresponding base specification and defines a set of new constraints to make the subsequent modified specification better fit the requirements of the target community. Once the profile has been defined, the next step is to create the corresponding Conformance Test Systems and Certification process for that profile: these will be modified versions of the equivalents created for the base specification. It is recommended that profiling is undertaken within 1EdTech so that the 1EdTech model driven specification tools can be used.

A profile is the product produced by the process of specification Profiling. A Profile of an 1EdTech specification consists of a set of new constraints. In general an 1EdTech specification enables a wide range education and learning workflows, processes and practices. A profile is designed to establish and impose best practices for the target community. A profile MUST only increase constraints i.e. it MUST NOT relax constraints in the base specification. For example the multiplicity of a property in the data model MAY be changed from `[1..*]` (required and permitting many) to `[1..1]` (required and only one) but MUST NOT become `[0..*]` (optional and permitting many). The most common profiling changes include more strict data typing, changes to enumerations, vocabulary changes, prohibition of endpoints and creation of new endpoints. A profile could make use of the extension capabilties to extend the specification to support new features. The key objective of a rofile is to remove, wherever possible, interoperability uncertainty e.g. by removing optionality.

It is strongly recommended that a profile of this standard is undertaken either by, or with the close support, of 1EdTech. However, no matter who is responsible for creating the profile artefacts (documents, schemas, etc.), it is strongly recommended that 1EdTech specification tools are used. This will ensure that the artefacts are consistent with the base specifications and that useful support documentation is automatically produced e.g. creation of a document that summarises the differences between the base specification and the profile.

---

## Appendices

*Note: Additional appendices containing detailed data models, JSON schemas, and normative references would typically appear here in the complete specification.*

---

**Document Information:**
- **Version:** 3.0
- **Status:** Draft Specification
- **Publication Date:** TBD
- **Copyright:** © 2024 1EdTech Consortium, Inc.

---

*End of Document*





# **AccuZIP API Integration Guide for Direct Mail Campaign Order Processing**

This document outlines the necessary steps, API calls, and considerations for integrating the AccuZIP REST API into your web application to validate customer mailing lists, obtain deliverable and undeliverable address counts, update order quantities, and generate a filtered list of only deliverable addresses.

## **1\. Introduction**

This document provides a comprehensive guide for developers to integrate AccuZIP's cloud-based Data Quality (DQ) and Mail Processing REST API. The primary goal is to validate customer-uploaded mailing lists, calculate deliverable and undeliverable addresses, adjust order quantities based on deliverable counts, display undeliverable counts to customers, and provide a downloadable CSV containing only deliverable records for checkout.

## **2\. AccuZIP API Overview**

The AccuZIP REST API offers a 100% cloud-based solution for various mail processing tasks, including CASS Certification, NCOALink Certification, Duplicate Detection, Postal Presorting, and generating print-ready files. All API interactions utilize specific base URLs:

* **Web Services:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/`  
* **Web Applications (Upload/Download):** `https://cloud2.iaccutrace.com/ws_360_webapps/`

## **3\. Authentication**

Authentication for most API calls requires an **API Key**, which is a GUID key provided with your AccuZIP account. You can retrieve information about your account and access level using the `Account Info` web service.

### **Account Info Endpoint**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO`  
* **Method:** `POST`  
* **Body (Required):** `<apiKey>`

**Access Levels:**

* **2:** Direct Mail  
* **3:** Direct Mail and Limited 25-record Mailing Lists Test Environment  
* **4:** Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment  
* **5:** Direct Mail with EDDM and Mailing Lists

**Success Response Example:**

{  
  "account\_type": "Subscription",  
  "level": "4",  
  "success": true,  
  "active": true,  
  "credits\_remaining": {  
    "total": "106",  
    "monthly": "96",  
    "annual": "193"  
  },  
  "services": "Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment",  
  "credits\_used": {  
    "total": "94",  
    "monthly": "4",  
    "annual": "7"  
  }  
}

**Error Response Example:**

{  
  "success": false,  
  "message": "submitted API\_KEY not found \<\<apiKey\>\>"  
}

## **4\. API Rate Limits and File Constraints**

**File Upload Rate Limits:**

* Maximum of **12 individual files** can be uploaded per minute under the same API Key
* When limit exceeded, API returns HTTP 409 Conflict with Retry-After header

**File Size Constraints:**

* **Minimum:** 3 rows (including header and 2 detail rows)
* **Maximum:** 2,000,001 rows (including header and detail rows)
* Each row must be terminated with Carriage Return and Line Feed (CRLF) or Line Feed (LF) only
* File extension must always be `.csv`

**Rate Limit Error Response (HTTP 409 Conflict):**

{
  "success": false,
  "message": "You have attempted to upload too many files within a one (1) minute period. Please wait 4 seconds before attempting to upload a new file. File Upload Limit: 12 per minute"
}

**File Size Violation Responses:**

*Minimum violation (HTTP 400 Bad Request):*

{
  "success": false,
  "message": "File line count of {fileCount} is less than required count of 3."
}

*Maximum violation (HTTP 400 Bad Request):*

{
  "success": false,
  "message": "File line count of {fileCount} is more than the required count of 1000001."
}

**Additional Resources:**

* Complete API Documentation: docs.accuzip.com
* API Technical Support: api@accuzip.com

---

## **Related Documentation**

This AccuZIP integration guide is part of the Mailing List Manager documentation suite:

### **Planning & Architecture**
- **[PRD.md](PRD.md)** - Product requirements for address validation feature (Section 10)
- **[Technical-Architecture.md](Technical-Architecture.md)** - System architecture and environment configuration
- **[Development-Roadmap.md](Development-Roadmap.md)** - Implementation tasks for validation system (Phase 5)

### **Implementation Specifications**
- **[API-Specification.md](API-Specification.md#validation-endpoints)** - MLM validation endpoint specifications
- **[Database-Schema.md](Database-Schema.md)** - `validation_jobs` table schema and field mappings

### **Setup & Installation**
- **[README.md](../README.md)** - Project setup and AccuZIP account requirements

### **Key Integration Points**
- **Field Mapping:** See [Section 18](#18-field-mapping-reference-mlm--accuzip) below for MLM ↔ AccuZIP field mappings
- **Database Storage:** See [Section 19](#19-response-transformation-examples) below for response transformation examples
- **API Endpoints:** See [API-Specification.md](API-Specification.md) for MLM's validation API design
- **Implementation Tasks:** See [Development-Roadmap.md](Development-Roadmap.md) Phase 5 for step-by-step build tasks

---

## **5\. Real-Time Single Address Validation (Point-of-Entry API)**

For applications requiring real-time validation of individual addresses (e.g., user registration forms, checkout flows, profile updates), AccuZIP provides a CASS Point-of-Entry API that validates addresses instantly without the batch file processing workflow.

### **Use Cases for Point-of-Entry Validation**

* **Web Form Validation:** Validate addresses as users type them into registration or checkout forms
* **User Profile Updates:** Ensure address changes are valid before saving to database
* **Single Address Lookups:** Quick validation for customer service or administrative tools
* **Address Autocomplete Integration:** Combine with typeahead components for enhanced user experience

### **Point-of-Entry API Endpoint**

* **URL:** `https://api.iaccutrace.com/servoy-service/rest_ws/ws_address/ws_validate`
* **Method:** `POST`
* **Content-Type:** `application/x-www-form-urlencoded` or `application/json`

### **Required Parameters**

* **`API_KEY`**: Your AccuZIP API Key (GUID format)
* **`AZSetQuery_iadl1`**: Primary address line (e.g., "100 Main St")
* **`AZSetQuery_iadl2`**: Secondary address line (e.g., "Apt 200") - Can be empty string
* **`AZSetQuery_iadl3`**: Third address line (typically empty) - Can be empty string
* **`AZSetQuery_ictyi`**: City name (e.g., "Los Angeles")
* **`AZSetQuery_istai`**: State abbreviation (e.g., "CA")
* **`AZSetQuery_izipc`**: ZIP code (e.g., "90001" or "90001-1234")

### **Optional Parameters**

* **`AZSetQuery_iforeignid`**: Unique record identifier for tracking (e.g., user ID, order ID)
* **`AZSetQuery_icountry`**: Country code - Use "CA" for Canadian addresses, "US" or omit for United States

### **Request Example (JSON Format)**

```json
{
  "API_KEY": "your-api-key-guid-here",
  "AZSetQuery_iadl1": "1600 Amphitheatre Parkway",
  "AZSetQuery_iadl2": "",
  "AZSetQuery_iadl3": "",
  "AZSetQuery_ictyi": "Mountain View",
  "AZSetQuery_istai": "CA",
  "AZSetQuery_izipc": "94043",
  "AZSetQuery_iforeignid": "user-12345"
}
```

### **Request Example (Form Data)**

```
POST https://api.iaccutrace.com/servoy-service/rest_ws/ws_address/ws_validate
Content-Type: application/x-www-form-urlencoded

API_KEY=your-api-key-guid-here&AZSetQuery_iadl1=1600+Amphitheatre+Parkway&AZSetQuery_iadl2=&AZSetQuery_iadl3=&AZSetQuery_ictyi=Mountain+View&AZSetQuery_istai=CA&AZSetQuery_izipc=94043
```

### **Response Format**

The API returns a JSON object containing CASS-certified address data and validation status:

```json
{
  "success": true,
  "validated_address": {
    "delivery_line_1": "1600 AMPHITHEATRE PKWY",
    "delivery_line_2": "",
    "city": "MOUNTAIN VIEW",
    "state": "CA",
    "zip": "94043",
    "zip4": "1351",
    "dpv_code": "Y",
    "dpv_confirmation": "Y",
    "dpv_footnote": "AABB",
    "carrier_route": "C909",
    "delivery_point": "00",
    "check_digit": "6",
    "record_type": "S",
    "address_type": "FIRM"
  },
  "foreign_id": "user-12345"
}
```

### **Response Field Descriptions**

* **`dpv_code`**: Delivery Point Validation status
  * `Y` - Address is deliverable (both primary and secondary confirmed)
  * `D` - Primary address confirmed, secondary (apt/suite) missing
  * `S` - Primary address confirmed, secondary present but unconfirmed
  * `N` - Address not confirmed/not deliverable
* **`dpv_confirmation`**: Same as dpv_code (redundant field)
* **`dpv_footnote`**: CASS footnotes providing additional validation details
* **`carrier_route`**: USPS carrier route code
* **`zip4`**: Four-digit ZIP code extension
* **`record_type`**: Address classification (S=Street, P=PO Box, H=Highrise, R=Rural Route)
* **`address_type`**: Additional classification (FIRM, GENERAL DELIVERY, etc.)

### **Batch Validation via Point-of-Entry**

While designed for single address validation, the Point-of-Entry API can process small batches:

* **Recommended Maximum:** 20 addresses per batch
* **Use Case:** Form validation with multiple shipping addresses
* **Implementation:** Loop through addresses and make individual API calls, or submit as array if supported

### **Integration Example for Web Forms**

```javascript
// Example: Real-time address validation on form submission
async function validateAddress(addressData) {
  const payload = {
    API_KEY: process.env.ACCUZIP_API_KEY,
    AZSetQuery_iadl1: addressData.street,
    AZSetQuery_iadl2: addressData.unit || "",
    AZSetQuery_iadl3: "",
    AZSetQuery_ictyi: addressData.city,
    AZSetQuery_istai: addressData.state,
    AZSetQuery_izipc: addressData.zip,
    AZSetQuery_iforeignid: addressData.userId
  };

  const response = await fetch(
    'https://api.iaccutrace.com/servoy-service/rest_ws/ws_address/ws_validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const result = await response.json();

  if (result.success && result.validated_address.dpv_code === 'Y') {
    // Address is fully validated - use standardized version
    return {
      valid: true,
      standardized: result.validated_address
    };
  } else {
    // Address has issues - prompt user for correction
    return {
      valid: false,
      message: getDpvMessage(result.validated_address.dpv_code),
      suggestion: result.validated_address
    };
  }
}

function getDpvMessage(dpvCode) {
  const messages = {
    'D': 'Apartment or suite number may be missing',
    'S': 'Apartment or suite number could not be verified',
    'N': 'Address could not be validated. Please verify and try again.'
  };
  return messages[dpvCode] || 'Address validation failed';
}
```

### **Canadian Address Validation**

AccuZIP supports Canadian address validation through the Point-of-Entry API with the same endpoint and structure:

**Canadian-Specific Parameters:**

* **`AZSetQuery_icountry`**: Set to "CA" for Canadian addresses
* All other parameters remain the same
* Province codes should be used in `AZSetQuery_istai` (e.g., "ON", "BC", "QC")
* Canadian postal codes should be provided in `AZSetQuery_izipc` (e.g., "K1A 0B1")

**Canadian Address Example:**

```json
{
  "API_KEY": "your-api-key-guid-here",
  "AZSetQuery_iadl1": "55 Metcalfe Street",
  "AZSetQuery_iadl2": "Suite 1600",
  "AZSetQuery_iadl3": "",
  "AZSetQuery_ictyi": "Ottawa",
  "AZSetQuery_istai": "ON",
  "AZSetQuery_izipc": "K1P 6L5",
  "AZSetQuery_icountry": "CA"
}
```

**Important Notes for Canadian Addresses:**

* Canadian address validation may consume credits differently than US addresses - verify pricing with AccuZIP
* Response format remains consistent with US addresses
* Canada Post validation standards are applied instead of USPS CASS standards
* DPV codes may have slightly different interpretations for Canadian addresses

### **Error Responses**

**Invalid API Key:**

```json
{
  "success": false,
  "message": "Invalid API_KEY provided"
}
```

**Missing Required Parameters:**

```json
{
  "success": false,
  "message": "Required parameter AZSetQuery_iadl1 is missing"
}
```

### **Performance and Credit Considerations**

* **Response Time:** Typically 100-500ms per address
* **Credit Consumption:** Each validation consumes credits based on your account pricing
* **Rate Limiting:** Subject to API rate limits - implement appropriate throttling for high-volume scenarios
* **Caching Strategy:** Consider caching validated addresses to reduce API calls for frequently used addresses

### **When to Use Point-of-Entry vs Batch Processing**

**Use Point-of-Entry API when:**
* Validating addresses in real-time during user input
* Processing fewer than 20 addresses at a time
* Immediate validation feedback is required
* Integration with web forms, checkout flows, or user profiles

**Use Batch File Processing when:**
* Processing large mailing lists (hundreds to millions of records)
* Performing comprehensive data quality operations (CASS + NCOA + Deduplication)
* Generating presorted mail files for postal discounts
* Validation results are needed asynchronously

## **6\. Workflow Steps for Mailing List Validation and Filtering**

The following steps detail the interaction with the AccuZIP API to achieve your desired use case:

### **Step 1: Upload Mailing List for Validation**

The first step is to upload the customer's mailing list and initiate Data Quality (DQ) processing to obtain validation results.

#### **File Format Requirements**

* **File Extension:** MUST ALWAYS be `.csv` (e.g., `myfilename.csv`). Files with different extensions will be ignored.  
* **Delimiter:** The data can be **TAB, PIPE, or COMMA-SEPARATED**  
* **Row Termination:** Each row must be terminated with CRLF (Carriage Return \+ Line Feed) or LF (Line Feed) only  
* **Minimum Rows:** Files must contain a **minimum of 3 rows** (including header and 2 detail rows)  
* **Header Record:** The **first row must be the Header Record** describing the columns

#### **Required Column Names (Case-insensitive matching)**

* **`First`**: Can contain First and Last Name; Name Prefix, First, Middle and Last; or just First name (e.g., "John Smith", "Mr. John M Smith", "John")  
* **`Address`**: The primary address (e.g., "100 Main St", "PO Box 1")  
* **`City`**: Can contain City, State, and Zip; City, State; or just City name (e.g., "Los Angeles CA 90001", "Los Angeles CA", "Los Angeles")

#### **Optional Column Names**

* `Sal`: Name prefix (e.g., "Mr", "Mrs", "Mr. and Mrs.")  
* `Middle`: Middle name of the contact  
* `Last`: Last name of the contact  
* `Address2`: Secondary address information (e.g., "Ste 200", "\# 200")  
* `St`: State abbreviated name (e.g., "CA", "TX")  
* `Zip`: ZIP or ZIP+4 code (e.g., "99999", "99999-9999")  
* `Urban`: Puerto Rico Urbanization Name  
* `Company`: Company/firm name (important for NCOA purposes)

**Complete Column Name Reference:** For a comprehensive list of all supported column names, refer to: http://www.accuzip.com/files/CompleteColumnNameList.xlsx

#### **File Content Examples**

**Comma Separated File:**

"first","last","address","address2","city","st","zip"  
"John","Smith","PO Box 7602","","St Thomas","VI","00801"

**PIPE Separated File:**

"first"|"last"|"address"|"address2"|"city"|"st"|"zip"  
"John"|"Smith"|"PO Box 7602"|""|"St Thomas"|"VI"|"00801"

#### **Upload File Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/v2_0/uploadProcess.jsp?manual_submit=false`  
* **Method:** `POST`  
* **URL Parameters (Required):** `manual_submit=false`

#### **Required Data Parameters (Order is extremely important)**

* `backOfficeOption`  
* `json`  
* **`apiKey`**: Your AccuZIP API Key  
* **`callbackURL`**: A URL on your server where AccuZIP will send an HTTP GET notification with the `guid` upon job completion (e.g., `http://mysite.com/getAccuzipCallback.php`). This acts as a webhook.  
* **`guid`**: A unique identifier for the uploaded job  
* `file`: The filepath of the uploaded CSV file

#### **Field Mapping Parameters (Use when your column names differ from defaults)**

* `col_address`: Header Field Name for Mailing Address (e.g., "my address")  
* `col_address2`: Header Field Name for Secondary Address (e.g., "my adr2")  
* `col_city`: Header Field Name for City name (e.g., "my city")  
* `col_st`: Header Field Name for State abbreviation (e.g., "my state")  
* `col_zip`: Header Field Name for ZIP Code or ZIP+4 (e.g., "my zip code")

#### **Additional Data Parameters**

* **`des_credits=false`**: Setting this value to `true` will trigger the GET QUOTE to return the number of credits that you have in your account  
* **`list_owner_paf_id`**: PAF ID assigned by AccuZIP to process files through their Licensed NCOALink service

#### **Recommended Additional Data Parameters for Data Quality Results**

* **`dataQualityResults_CASS=true`**: For CASS ONLY data quality results  
* **`dataQualityResults_NCOA=true`**: For CASS AND NCOA data quality results

**Important:** Only one of the `dataQualityResults_*` settings can be used in a single upload call. These settings provide more accurate postage totals and rate categories compared to the basic `dataQualityResults=true` option.

#### **Available Data Quality Result Settings**

* `dataQualityResults_CASS`: CASS ONLY data quality results  
* `dataQualityResults_NCOA`: CASS AND NCOA ONLY data quality results  
* `dataQualityResults_NCOA_DUPS_01`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND COMPANY  
* `dataQualityResults_NCOA_DUPS_02`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND FIRST AND LAST NAME  
* `dataQualityResults_NCOA_DUPS_03`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME  
* `dataQualityResults_DUPS_01`: CASS AND DUPLICATE DETECTION BY ADDRESS AND COMPANY ONLY  
* `dataQualityResults_DUPS_02`: CASS AND DUPLICATE DETECTION BY FIRST AND LAST NAME ONLY  
* `dataQualityResults_DUPS_03`: CASS AND DUPLICATE DETECTION BY HOUSEHOLD NAME ONLY

#### **Success Response**

{  
  "success360Import": true,  
  "quote\_started": true,  
  "cass\_started": false,  
  "guid": "7ebb2c37-648b-4f6e-aa6d-240dc55aef2c"  
}

#### **Error Response**

{  
  "success": false,  
  "message": "ERROR Invalid API Key\!"  
}

### **Step 2: Retrieve Data Quality Results and Counts**

After uploading the file, you need to make a `GET QUOTE` call to retrieve the Data Quality (DQ) results, including counts for deliverable and undeliverable addresses.

#### **Get Quote Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`  
* **Method:** `GET`  
* **URL Parameters:** `<guid>`: The GUID obtained from the Upload File success response

#### **Success Response Content Examples**

**Default Content (Approximate values):**

{  
  "task\_name": "FINISHED",  
  "First\_Class\_Flat": "$619",  
  "task\_percentage\_completed": "100",  
  "Estimated\_Postage\_Standard\_Card": "$549",  
  "Estimated\_Postage\_Standard\_Letter": "$549",  
  "format": "",  
  "task\_state": "FINISHED",  
  "First\_Class\_Card": "$154",  
  "success": true,  
  "total\_records": "2,001",  
  "postage\_saved": ""  
}

**Content when using `dataQualityResults_*` parameters:**

{  
  "dq\_dpvhsa\_s": "70",  
  "dq\_dpvhsa\_d": "11",  
  "dq\_dpvhsv": "31",  
  "dq\_dpvhsa\_y": "1892",  
  "dq\_dpvhsa\_n": "27",  
  "dq\_message": "DQ results have been calculated successfully",  
  "success": true,  
  "total\_records": "2000"  
}

**Enhanced Content with New dataQualityResults Settings:**

{  
  "dq\_dpvhsa\_s": "70",  
  "First\_Class": \[{  
    "flat": \[{"postage": "1126.12", "AB": "91", "PRESORT": "0", "MB": "30", "savings": "846.88", "5B": "470", "SP": "27", "3B": "1355"}\],  
    "letter": \[{"postage": "812.98", "AB": "1186", "PRESORT": "0", "MB": "760", "savings": "114.33", "5B": "0", "SP": "27", "3B": "0"}\],  
    "card": \[{"postage": "529.70", "AB": "1186", "PRESORT": "0", "MB": "760", "savings": "160.85", "5B": "0", "SP": "27", "3B": "0"}\]  
  }\],  
  "Standard": \[{  
    "flat": \[{"AB": "77", "AD": "8", "HP": "0", "5B": "607", "CR": "0", "3B": "1233", "5D": "0", "postage": "930.72", "3D": "3", "MB": "29", "MD": "16", "savings": "1042.28", "WS": "0", "HD": "0", "SP": "0"}\],  
    "letter": \[{"AB": "1186", "AD": "0", "HP": "0", "5B": "0", "CR": "0", "3B": "0", "5D": "0", "postage": "548.86", "3D": "0", "MB": "787", "MD": "0", "savings": "378.45", "WS": "0", "HD": "0", "SP": "0"}\]  
  }\],  
  "Duplicates": \[{"found": "20", "description": "by Address and First and Last Name", "setting": "2"}\],  
  "NCOALink": \[{"months\_19\_48": "205", "matches": "296", "months\_1\_18": "91", "moved\_no\_forwarding": "7"}\],  
  "dq\_dpvhsa\_d": "11",  
  "dq\_dpvhsv": "31",  
  "dq\_dpvhsa\_y": "1892",  
  "dq\_message": "DQ results have been calculated successfully",  
  "dq\_dpvhsa\_n": "27",  
  "success": true  
}

#### **Data Quality (DQ) Result Field Descriptions**

These fields provide detailed information about the DPV (Delivery Point Validation) status of addresses:

* **`dq_message`**: "DQ results have been calculated successfully"  
* **`dq_dpvhsa_y`**: Number of addresses DPV confirmed for both primary and (if present) secondary numbers (perfect addresses)  
* **`dq_dpvhsa_d`**: Number of addresses DPV confirmed for the primary number only, with secondary number information missing  
* **`dq_dpvhsa_s`**: Number of addresses DPV confirmed for the primary number only, with secondary number information present but unconfirmed  
* **`dq_dpvhsa_n`**: Number of addresses where both primary and (if present) secondary number information failed DPV Confirmation  
* **`dq_dpvhsv`**: Number of addresses identified as Vacant for at least 90 days

#### **Calculation of Deliverable and Undeliverable Addresses**

**Deliverable Addresses (for order quantity):**

* Use the value of `dq_dpvhsa_y` (addresses confirmed for both primary and secondary numbers)

**Undeliverable Addresses (to display to customer):**

* Sum of `dq_dpvhsa_d` \+ `dq_dpvhsa_s` \+ `dq_dpvhsa_n` \+ `dq_dpvhsv`

#### **Processing Status Monitoring**

Monitor the processing status using these JSON objects in GET QUOTE responses:

* **`task_name`**: Describes the current task (e.g., "OPTIMIZING", "CASS CERTIFY", "NCOALINK", "DUPLICATE DETECTION", "PRESORT", "FINISHED")  
* **`task_percentage_completed`**: Either "0" (Started) or "100" (Finished)  
* **`task_state`**: Returns "FINISHED" only when the entire process is completed and files are ready for download

#### **Error Responses**

{  
  "message": "QUOTE is still processing.",  
  "success": false  
}

### **Step 3: Update Order Quantity and Display Undeliverable Addresses (Application Logic)**

Using the counts obtained in Step 2:

1. **Update Order Quantity:** Adjust your application's order quantity for the direct mail campaign with the calculated **Deliverable Addresses** (`dq_dpvhsa_y`)  
2. **Display Undeliverable Count:** Present the total **Undeliverable Addresses** (sum of `dq_dpvhsa_d`, `dq_dpvhsa_s`, `dq_dpvhsa_n`, and `dq_dpvhsv`) to the customer in your web application

### **Step 4: Configure Mail Processing Parameters**

Before processing the list, you must configure the mail piece parameters and postal settings using the Update Quote endpoint.

#### **Update Quote Web Service Call (Set Mail Parameters)**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`  
* **Method:** `PUT`  
* **Header Parameters (Required):** `Accept: application/json` or `application/xml`; `Content-Type: application/json`

**Important Settings for Mail Processing:**

* Set `presort_class` (e.g., "STANDARD MAIL")  
* Set `mail_piece_size` (e.g., "LETTER" or "FLAT")

**JSON Configuration Example:**

{  
  "presort\_class": "STANDARD MAIL"  // also supports "USPS Marketing Mail (formerly Standard Mail)"  
  "mail\_piece\_size": "LETTER"  
}
**For EDDM mailings, you must set:**

{  
  "presort\_class": "STANDARD MAIL (EDDM)",  
  "mail\_piece\_size": "LETTER"  
}

**Available Settings:** See available settings at http://www.accuzip.com/files/json\_values.xlsx and JSON example at http://www.accuzip.com/files/json\_values\_example.json

**Success Response:** `HTTP 200 - OK` **Error Response:** `HTTP 404 – NOT_FOUND`

### **Step 5: Process List with Filters and Mail Processing**

Use one of the comprehensive processing endpoints that combine CASS Certification, NCOALink, Duplicate Detection, and Presort. These all-in-one endpoints automatically apply filters to exclude undeliverable records.

**Available All-in-One Processing URLs:**

**CASS Certification, NCOALink, Duplicate Detection and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_01-PRESORT` (Duplicates by ADDRESS and COMPANY)  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_02-PRESORT` (Duplicates by FIRST AND LAST NAME)  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_03-PRESORT` (Duplicates by HOUSEHOLD NAME)

**CASS Certification, Duplicate Detection and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_01-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_02-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_03-PRESORT`

**CASS Certification, NCOALink and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-PRESORT`

**CASS Certification and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-PRESORT`

**Method:** `GET` **URL Parameters:** `<guid>`: The GUID for the job

**Success Response:**

{  
  "success": true  
}

**Important Notes:**

* These all-in-one calls run **asynchronously**, meaning control is returned immediately  
* A `callbackURL` notification will be sent upon completion  
* Individual API calls (CASS, NCOA, DUPS, PRESORT) run synchronously and wait for completion

### **Step 6: Download Deliverable-Only CSV**

Once the filtering and processing are complete, you can download the print-ready CSV file containing only the deliverable records.

#### **Download Print Ready CSV Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=csv`  
* **Method:** `GET`  
* **URL Parameters:**  
  * `<guid>`: The GUID for the job  
  * `ftype=csv`: Specifies that you want the full print-ready, presorted CSV file

**Available File Types:**

* `csv`: Full print-ready, presorted CSV file  
* `prev.csv`: First 25 records of the print-ready CSV for preview  
* `json`: The entire CASS or CASS/NCOALink processed file in JSON format  
* `presort.json`: A JSON file specific to presort data

**Success Response:** The raw content of the CSV file will be streamed directly. This file will contain only the addresses that passed your specified filters, ready to be attached to the order.
**Success Response:** The raw content of the CSV file will be streamed directly. This file will contain only the addresses that passed your specified filters, ready to be attached to the order.

**Error Response Examples:**

* `HTTP 500 – INTERNAL_SERVER_ERROR`  
* `HTTP 400 – BAD REQUEST`
* `HTTP 200 – OK` with error message: `{"success":false,"message":"File with specified extension does NOT exist"}`

## **7\. Individual Processing Steps (Granular Control)**

For applications requiring more granular control over the processing pipeline, you can execute individual processing steps:

### **CASS Certification**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS`  
* **Method:** `GET`  
* **Purpose:** Clean and standardize all addresses in the file

**Success Response:**

{  
  "Addresses": {"Rows": \[\]},  
  "NoFilteredRows": 0,  
  "TotalRows": 0,  
  "success": true  
}

### **NCOALink Certification**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/NCOA`
* **Method:** `GET`
* **Purpose:** Process names and addresses through Licensed NCOALink for Change of Address matching

**Requirements:** AccuZIP must have a fully executed Processing Acknowledgment Form (PAF) on file for each List Owner. Electronic PAF completion available at: http://accuzip.com/products/ncoalink/paf/new

**Success Response:**

{
  "success": true
}

#### **Extended 60-Month NCOALink Processing**

AccuZIP offers an optional extended NCOALink processing option that provides enhanced compliance and more comprehensive change of address matching.

**Standard vs Extended NCOALink:**

* **Standard NCOALink:** 48-month change of address history (default)
  * Captures address changes from the past 4 years
  * Suitable for most commercial mailing list hygiene needs
  * Standard USPS NCOALink compliance

* **Extended 60-Month NCOALink:** 60-month change of address history (optional)
  * Captures address changes from the past 5 years
  * Additional 12 months of historical address change data
  * Enhanced compliance for regulated industries

**Use Cases for Extended 60-Month Processing:**

* **Financial Institutions:** Banks, credit unions, and investment firms with regulatory requirements for extended address verification
* **Legal and Compliance:** Law firms, collection agencies, and compliance departments requiring maximum address accuracy
* **Healthcare Organizations:** Medical facilities and insurance companies with HIPAA-related address verification requirements
* **Government Agencies:** Public sector organizations with extended record-keeping mandates
* **High-Value Customer Communications:** Organizations mailing to high-value customers where deliverability is critical

**How to Enable 60-Month Processing:**

To request extended 60-month NCOALink processing for your account or specific jobs:

1. **Contact AccuZIP Sales or Support:**
   * Sales: 800.233.0555
   * API Support: api@accuzip.com
   * Request extended NCOALink processing for your API key

2. **Account-Level Activation:**
   * Extended processing can be enabled at the account level (all jobs)
   * Or configured per-job basis upon request

3. **PAF Requirements:**
   * Same Processing Acknowledgment Form (PAF) requirements apply
   * No additional PAF needed for extended processing
   * Existing PAF covers both standard and extended processing

**Pricing and Credit Considerations:**

* Extended 60-month processing may consume additional credits compared to standard 48-month processing
* Pricing varies based on account type and processing volume
* Contact AccuZIP sales for specific pricing information
* Verify credit consumption rates before implementing for high-volume operations

**API Implementation Notes:**

* The standard NCOA endpoint is used for both 48-month and 60-month processing
* No endpoint changes required once extended processing is enabled on your account
* Response format remains identical
* Processing time may be slightly longer due to extended data range

### **Duplicate Detection**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPS/<duplicateSubType>`  
* **Method:** `GET`  
* **URL Parameters:**  
  * `<duplicateSubType>`:  
    * `01` \- Address Only and if exists, Company  
    * `02` \- First and Last name  
    * `03` \- Household name

**Success Response:**

{  
  "success": true  
}

### **Presort Postal Discounts**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/PRESORT`  
* **Method:** `GET`  
* **Purpose:** Process CASS Certified addresses through Cloud Presort engine for lowest postage rates

**Success Response:**

{  
  "success": true  
}

## **8\. Advanced Data Retrieval and Review**

The API provides endpoints to retrieve processed records for customer review:

### **Retrieve CASS Certified Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CleanAddresses/<filterSubType>`  
* **Method:** `GET`  
* **Filter Sub Types:**  
  * `2` \- Unit number provided but not verified  
  * `3` \- Unit number missing from known high-rise address  
  * `4` \- Vacant  
  * `5` \- Business address  
  * `6` \- Private Mail Box address  
  * `7` \- Address not valid  
  * `8` \- Missing address element(s)  
  * `9` \- Foreign  
  * `99` \- All

### **Retrieve NCOALink Certified Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/MoveUpdate/<filterSubType>`  
* **Method:** `GET`  
* **Filter Sub Types:**  
  * `1` \- Moved \- COA Matches  
  * `2` \- Moved \- New Address cannot be confirmed  
  * `3` \- Moved \- Left No Forwarding  
  * `4` \- Moved \- Foreign Country  
  * `5` \- Moved \- New State  
  * `6` \- Individual Match  
  * `7` \- Family Match  
  * `8` \- Business Match  
  * `99` \- All NCOALink Matches

### **Retrieve Duplicate Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPLICATES/<duplicateSubType>`  
* **Method:** `GET`  
* **Purpose:** Retrieve duplicate records found during duplicate detection processing

### **Replace All Data**

### **Replace All Data**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>`  
* **Method:** `PUT`
* **Purpose:** Write back modified records to the cloud after customer review and edits
* **Header Parameters:** `Accept: application/json` or `application/xml`; `Content-Type: application/json`; `Idempotency-Key: <uuid>`

## **9\. EDDM (Every Door Direct Mail) Support**

For EDDM campaigns, AccuZIP supports uploading ZIP code ranges instead of address lists:

### **EDDM File Requirements**

* **File Name:** Must be named `eddm@.csv`  
* **Format:** Comma-delimited without header record  
* **Columns:** Low ZIP, High ZIP, Low CRRT, High CRRT

**Example EDDM File:**

93422,,,  
93422,93425,,  
93422,,C000,C999

**EDDM Examples:**

* **Single ZIP Code:** `93422,,,` \- Generates list for 100% of addresses in ZIP Code  
* **Range of ZIP Codes:** `93422,93425,,` \- Generates list for all ZIP Codes between range  
* **ZIP Code with City Routes:** `93422,,C000,C999` \- Generates list for specific CRRT codes

## **10\. Download Additional Documentation**

### **USPS Documentation (PDF)**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=pdf`  
* **Content:** Bookmarked PDF including Mailing Statement, Qualification Report, CASS Certificate, NCOALink Certificate, Presort Summary, and supplemental reports

### **Mail.dat Files for PostalOne\!**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=maildat.zip`  
* **Content:** Mail.dat files for PostalOne\! eDoc upload

## **11\. PostalOne\! Integration**

### **PostalOne\! Automated Upload**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/POSTALONE`  
* **Method:** `GET`  
* **Purpose:** Communicate with PostalOne\! for Upload, Update, Cancel and Delete Full-Service Mail.dat jobs

**Required Update Quote Parameters for PostalOne\!:**

{  
  "p1\_env": "{{environment}}",  
  "p1\_usr": "{{username}}",  
  "p1\_psw": "{{password}}",  
  "p1\_action": "{{action}}",  
  "mailing\_date": "{{mailingdate}}"  
}

**Important Note:** The `maildat_jobid` must be unique and a maximum of 8-bytes, Alpha/Numeric only. If not provided, the first 8-bytes of the Input File name is used.

## **12\. Webhook Implementation**

### **Webhook Handler for AccuZIP Callbacks**

AccuZIP supports webhook notifications when processing is complete. Implement an endpoint to handle these callbacks:

**Callback URL Format:** Your specified callback URL will receive an HTTP GET request with the GUID parameter when processing completes.

**Example:** If you specify `http://mysite.com/getAccuzipCallback.php`, AccuZIP will call: `http://mysite.com/getAccuzipCallback.php?guid=<guid>`

### **Webhook Implementation Example**

// Example webhook handler
app.get('/accuzip-callback', (req, res) => {
  const guid = req.query.guid;

  if (!guid) {
    return res.status(400).send('Missing GUID');
  }

  // Process the completion notification
  processAccuZipCompletion(guid);

  res.status(200).send('Webhook received');
});

## **13\. Frontend Integration: Address Typeahead Component**

AccuZIP provides address autocomplete/typeahead functionality that can be integrated into web applications to enhance user experience and improve address data quality at the point of entry.

### **Benefits of Address Typeahead**

* **Improved User Experience:** Users can quickly find and select their address with minimal typing
* **Reduced Validation Errors:** Pre-validated addresses reduce the likelihood of validation failures
* **Faster Data Entry:** Autocomplete suggestions speed up form completion
* **Standardized Input:** Ensures addresses are entered in USPS-standardized format from the start
* **Lower API Costs:** Fewer validation calls needed when addresses are pre-standardized

### **Integration Approaches**

AccuZIP's typeahead functionality can be integrated through two primary approaches:

#### **1\. Direct Point-of-Entry API Integration**

Build your own typeahead component using the Point-of-Entry API (see Section 4):

**Implementation Pattern:**

```javascript
// Example: Custom typeahead with AccuZIP Point-of-Entry API
class AddressTypeahead {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.debounceTimer = null;
  }

  async searchAddresses(partialAddress) {
    // Debounce to avoid excessive API calls
    clearTimeout(this.debounceTimer);

    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          // Parse partial address into components
          const components = this.parsePartialAddress(partialAddress);

          // Call Point-of-Entry API
          const response = await fetch(
            'https://api.iaccutrace.com/servoy-service/rest_ws/ws_address/ws_validate',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                API_KEY: this.apiKey,
                AZSetQuery_iadl1: components.street || '',
                AZSetQuery_iadl2: '',
                AZSetQuery_iadl3: '',
                AZSetQuery_ictyi: components.city || '',
                AZSetQuery_istai: components.state || '',
                AZSetQuery_izipc: components.zip || ''
              })
            }
          );

          const result = await response.json();

          if (result.success) {
            resolve([this.formatSuggestion(result.validated_address)]);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('Address lookup failed:', error);
          resolve([]);
        }
      }, 300); // 300ms debounce
    });
  }

  parsePartialAddress(input) {
    // Basic parsing logic - enhance based on your needs
    const parts = input.split(',').map(s => s.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zip: parts[3] || ''
    };
  }

  formatSuggestion(validatedAddress) {
    return {
      label: `${validatedAddress.delivery_line_1}, ${validatedAddress.city}, ${validatedAddress.state} ${validatedAddress.zip}-${validatedAddress.zip4}`,
      value: validatedAddress
    };
  }
}

// Usage in React component
function AddressInputWithTypeahead() {
  const [suggestions, setSuggestions] = useState([]);
  const typeahead = new AddressTypeahead(process.env.ACCUZIP_API_KEY);

  const handleAddressInput = async (value) => {
    if (value.length > 5) {
      const results = await typeahead.searchAddresses(value);
      setSuggestions(results);
    }
  };

  return (
    <Autocomplete
      onInputChange={(e, value) => handleAddressInput(value)}
      options={suggestions}
      renderInput={(params) => <TextField {...params} label="Address" />}
    />
  );
}
```

#### **2\. Third-Party Address Autocomplete Solutions**

Alternatively, integrate third-party address autocomplete services that use USPS data and combine with AccuZIP validation:

**Popular Options:**

* **Google Places API:** Geographic autocomplete with subsequent AccuZIP validation
* **Smarty (formerly SmartyStreets):** USPS-based autocomplete with real-time validation
* **Loqate (formerly PCA Predict):** International address autocomplete
* **Melissa Data:** Address autocomplete and validation services

**Hybrid Approach Pattern:**

```javascript
// Example: Combine Google Places autocomplete with AccuZIP validation
async function handleAddressSelected(googlePlaceResult) {
  // Extract address components from Google Places
  const addressComponents = parseGooglePlace(googlePlaceResult);

  // Validate with AccuZIP for CASS certification
  const validationResult = await validateWithAccuZIP(addressComponents);

  if (validationResult.valid) {
    // Use AccuZIP's standardized address
    return validationResult.standardized;
  } else {
    // Handle validation failure
    showValidationError(validationResult.message);
  }
}
```

### **Best Practices for Typeahead Implementation**

1. **Debouncing:** Implement input debouncing (300-500ms) to reduce API calls
2. **Minimum Character Threshold:** Only trigger suggestions after 5-10 characters entered
3. **Smart Parsing:** Intelligently parse free-form address input into components
4. **Error Handling:** Gracefully handle API failures without breaking the form
5. **Caching:** Cache recently validated addresses to reduce duplicate API calls
6. **Fallback to Manual Entry:** Always allow users to manually enter addresses if autocomplete fails
7. **Mobile Optimization:** Ensure typeahead works well on mobile devices with touch input

### **Performance Optimization**

**Reduce API Calls:**

```javascript
class OptimizedAddressTypeahead {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cache = new Map();
    this.debounceTimer = null;
  }

  async searchWithCache(partialAddress) {
    // Check cache first
    const cacheKey = partialAddress.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Perform API lookup
    const results = await this.searchAddresses(partialAddress);

    // Cache results for 1 hour
    this.cache.set(cacheKey, results);
    setTimeout(() => this.cache.delete(cacheKey), 3600000);

    return results;
  }
}
```

### **Accessibility Considerations**

Ensure your typeahead component meets accessibility standards:

* Use ARIA attributes (`aria-autocomplete`, `aria-controls`, `aria-activedescendant`)
* Support keyboard navigation (arrow keys, Enter, Escape)
* Provide screen reader announcements for suggestions
* Maintain proper focus management
* Ensure sufficient color contrast for suggestion list

### **Integration with Form Validation Libraries**

**Example with React Hook Form:**

```javascript
import { useForm, Controller } from 'react-hook-form';

function AddressForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="address"
        control={control}
        rules={{
          validate: async (value) => {
            const result = await validateWithAccuZIP(value);
            return result.valid || result.message;
          }
        }}
        render={({ field }) => (
          <AddressTypeaheadInput {...field} />
        )}
      />
    </form>
  );
}
```

### **Cost-Benefit Analysis**

**Typeahead Implementation Costs:**

* Development time for custom implementation: 20-40 hours
* Third-party autocomplete service fees (if applicable): $50-500/month
* AccuZIP validation API calls: Variable based on usage

**Benefits:**

* Reduced validation failures: 40-60% fewer errors
* Faster form completion: 30-50% time savings
* Lower support costs: Fewer address-related customer service issues
* Improved deliverability: Better data quality from the start

### **When to Implement Address Typeahead**

**High-Value Scenarios:**

* High-volume registration or checkout forms
* Applications with significant address entry friction
* B2C applications targeting non-technical users
* Mobile-first applications where typing is cumbersome

**May Not Be Necessary:**

* B2B applications with professional users
* Low-volume forms (< 100 submissions/month)
* Applications already using comprehensive batch validation
* Simple internal tools with technical users

## **14\. Error Handling and Best Practices**

### **Common Error Responses**

**Invalid API Key:**

{  
  "success": false,  
  "message": "ERROR Invalid API Key\!"  
}

**File Processing Errors:**

{  
  "success": false,  
  "message": "File with specified extension does NOT exist or belong to downloads for submitted GUID"  
}

**Process Still Running:**

{  
  "message": "QUOTE is still processing.",  
  "success": false  
}

**Missing Filter Value:**

{  
  "message": "Missing filter value",  
  "success": false  
}

**Rate Limit Exceeded:**

{  
  "success": false,  
  "message": "You have attempted to upload too many files within a one (1) minute period. Please wait 4 seconds before attempting to upload a new file. File Upload Limit: 12 per minute"  
}

**File Too Small:**

{  
  "success": false,  
  "message": "File line count of {fileCount} is less than required count of 3."  
}

**File Too Large:**

{  
  "success": false,  
  "message": "File line count of {fileCount} is more than the required count of 1000001."  
}

### **Best Practices**

1. **Asynchronous Processing:** Use webhook callbacks rather than polling for better performance  
2. **Error Handling:** Always implement robust error handling for all API calls  
3. **File Format Validation:** Ensure files meet the CSV format requirements before upload  
4. **Credit Management:** Monitor your credit usage through the Account Info endpoint  
5. **Field Mapping:** Use explicit field mapping parameters when your CSV headers don't match AccuZIP defaults  
6. **Process Dependencies:** Always complete CASS certification before NCOALink or Presort operations  
7. **Parameter Order:** The order of data parameters in the Upload File call is extremely important  
8. **Update Quote Requirement:** Always call Update Quote before Presort or All-In-One web services

### **Processing Flow Summary**

1. **Upload File** → Get GUID  
2. **Get Quote** → Check DQ results and counts  
3. **Update Quote** → Set mail piece parameters and filters  
4. **Process List** → Run CASS/NCOA/Presort (asynchronously)  
5. **Monitor Progress** → Via webhook callback or polling  
6. **Download CSV** → Get filtered deliverable-only file

## **15\. Credit Consumption and Pricing**

Understanding AccuZIP's credit consumption model is critical for budget planning and cost optimization in production environments.

### **Credit Consumption Pattern**

* You are generally not charged for uploading files or processing them
* Credits are consumed when you **download relevant files** like the production CSV or documentation
* Preview downloads (first 25 records) typically do not consume credits

**What Consumes Credits:**

* Downloading production CSV files (`ftype=csv`)
* Downloading USPS documentation PDFs (`ftype=pdf`)
* Downloading Mail.dat files (`ftype=maildat.zip`)
* Point-of-Entry API validation calls (per address)
* Extended 60-month NCOALink processing (if enabled)

**What Does NOT Consume Credits:**

* File uploads
* CASS/NCOA/Presort processing (processing itself)
* GET QUOTE calls
* Preview CSV downloads (`ftype=prev.csv`, first 25 records)
* Account Info endpoint calls
* Webhook callbacks

### **Monitoring Credits**

**Real-Time Credit Monitoring:**

Use the `des_credits=true` parameter in upload calls to include detailed credit information in GET QUOTE responses:

```json
// Upload call with credit tracking
{
  "apiKey": "your-api-key",
  "des_credits": "true",
  // ... other parameters
}

// GET QUOTE response includes credit details
{
  "success": true,
  "total_records": "5000",
  "credits_remaining": {
    "total": "1450",
    "monthly": "950",
    "annual": "500"
  },
  "credits_used": {
    "total": "550",
    "monthly": "50",
    "annual": "500"
  },
  "estimated_credit_cost": "50"
}
```

**Account Info Endpoint for Credit Balance:**

```javascript
// Check credit balance before processing
async function checkCreditBalance(apiKey) {
  const response = await fetch(
    'https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO',
    {
      method: 'POST',
      body: apiKey
    }
  );

  const accountInfo = await response.json();

  return {
    remaining: accountInfo.credits_remaining.total,
    used: accountInfo.credits_used.total,
    monthly: accountInfo.credits_remaining.monthly,
    annual: accountInfo.credits_remaining.annual
  };
}
```

### **Credit Management Best Practices**

#### **1\. Strategic Use of des_credits Parameter**

**When to Use `des_credits=true`:**

* Before processing large batch files
* When approaching credit limits
* For cost estimation and budgeting
* In production monitoring dashboards

**When to Omit:**

* Small test uploads
* Development and testing environments
* When response speed is critical (slightly slower with credit data)

#### **2\. Credit Balance Monitoring and Alerts**

Implement proactive monitoring to avoid service interruptions:

```javascript
// Example: Credit monitoring system
class CreditMonitor {
  constructor(apiKey, thresholds) {
    this.apiKey = apiKey;
    this.thresholds = {
      critical: thresholds.critical || 100,  // Alert when < 100 credits
      warning: thresholds.warning || 500,    // Warn when < 500 credits
      low: thresholds.low || 1000           // Info when < 1000 credits
    };
  }

  async checkAndAlert() {
    const credits = await this.getCurrentCredits();

    if (credits.remaining < this.thresholds.critical) {
      await this.sendAlert('CRITICAL', credits);
      // Consider pausing non-critical operations
      return { status: 'critical', credits };
    }

    if (credits.remaining < this.thresholds.warning) {
      await this.sendAlert('WARNING', credits);
      return { status: 'warning', credits };
    }

    if (credits.remaining < this.thresholds.low) {
      await this.sendAlert('INFO', credits);
      return { status: 'low', credits };
    }

    return { status: 'ok', credits };
  }

  async getCurrentCredits() {
    const response = await fetch(
      'https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO',
      { method: 'POST', body: this.apiKey }
    );
    const data = await response.json();
    return {
      remaining: parseInt(data.credits_remaining.total),
      monthly: parseInt(data.credits_remaining.monthly),
      annual: parseInt(data.credits_remaining.annual)
    };
  }

  async sendAlert(level, credits) {
    // Send email/Slack/PagerDuty notification
    console.log(`${level}: Only ${credits.remaining} credits remaining`);
    // Implement your alerting mechanism here
  }
}

// Usage
const monitor = new CreditMonitor(API_KEY, {
  critical: 50,
  warning: 200,
  low: 500
});

// Check before major operations
const status = await monitor.checkAndAlert();
if (status.status === 'critical') {
  // Prevent new jobs or notify admins
}
```

#### **3\. Budget Planning for High-Volume Operations**

**Calculate Estimated Monthly Credit Needs:**

```javascript
// Example: Budget calculator
function calculateMonthlyCreditNeeds(monthlyMailings) {
  // Assumptions based on your workflow
  const avgRecordsPerMailing = monthlyMailings.avgListSize;
  const mailingFrequency = monthlyMailings.frequency;
  const creditsPerThousandRecords = 10; // Verify with AccuZIP

  const totalRecordsPerMonth = avgRecordsPerMailing * mailingFrequency;
  const estimatedCredits = (totalRecordsPerMonth / 1000) * creditsPerThousandRecords;

  // Add 20% buffer for contingencies
  const bufferCredits = estimatedCredits * 0.20;

  return {
    baseEstimate: estimatedCredits,
    withBuffer: estimatedCredits + bufferCredits,
    breakdown: {
      mailings: mailingFrequency,
      avgListSize: avgRecordsPerMailing,
      totalRecords: totalRecordsPerMonth,
      creditsPerK: creditsPerThousandRecords
    }
  };
}

// Example usage
const budget = calculateMonthlyCreditNeeds({
  avgListSize: 50000,
  frequency: 4  // 4 mailings per month
});

console.log(`Estimated monthly credits needed: ${budget.withBuffer}`);
// Output: Estimated monthly credits needed: 2400
```

#### **4\. Credit Carry-Over Policies**

**Understanding AccuZIP Credit Types:**

Based on the Account Info response structure, AccuZIP credits are categorized as:

* **Monthly Credits:** Reset at the beginning of each billing cycle
  * Use-it-or-lose-it model
  * Best for recurring monthly mailing operations
  * Prioritize using monthly credits first

* **Annual Credits:** Valid for the subscription year
  * Carry over month-to-month within the subscription year
  * Better for variable/seasonal mailing needs
  * Fall back to annual credits when monthly depleted

* **Total Credits:** Combined monthly + annual balance

**Credit Consumption Strategy:**

```javascript
// Optimal credit usage strategy
function planCreditUsage(accountInfo, jobSize) {
  const monthlyAvailable = parseInt(accountInfo.credits_remaining.monthly);
  const annualAvailable = parseInt(accountInfo.credits_remaining.annual);
  const estimatedCost = calculateJobCost(jobSize);

  if (estimatedCost <= monthlyAvailable) {
    return {
      proceed: true,
      source: 'monthly',
      message: 'Using monthly credits (will reset next month)'
    };
  }

  if (estimatedCost <= (monthlyAvailable + annualAvailable)) {
    return {
      proceed: true,
      source: 'mixed',
      message: `Using ${monthlyAvailable} monthly + ${estimatedCost - monthlyAvailable} annual credits`
    };
  }

  return {
    proceed: false,
    source: null,
    message: 'Insufficient credits. Purchase additional credits.',
    shortage: estimatedCost - (monthlyAvailable + annualAvailable)
  };
}
```

#### **5\. Cost Optimization Strategies**

**Minimize Credit Consumption:**

1. **Use Preview Downloads for QA:**
   ```javascript
   // Download preview (free) before committing to full download
   const previewUrl = `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=${guid}&ftype=prev.csv`;
   const preview = await fetch(previewUrl);

   // Verify results look correct before downloading full file
   if (previewLooksGood(preview)) {
     const fullUrl = `...&ftype=csv`; // Now download full file (costs credits)
   }
   ```

2. **Batch Operations Efficiently:**
   * Combine multiple small lists into larger batches when possible
   * Some plans charge per-job vs per-record

3. **Cache Point-of-Entry Results:**
   * Store validated addresses to avoid re-validation
   * Implement address deduplication before API calls

4. **Use Data Quality Results Wisely:**
   * `dataQualityResults_CASS=true` for quote-only operations (no download planned)
   * Provides accurate counts without committing credits

5. **Implement Rate Limiting:**
   ```javascript
   // Prevent accidental credit exhaustion
   class RateLimitedAccuZIP {
     constructor(apiKey, maxCreditsPerDay) {
       this.apiKey = apiKey;
       this.maxCreditsPerDay = maxCreditsPerDay;
       this.creditsUsedToday = 0;
       this.lastResetDate = new Date().toDateString();
     }

     async downloadWithLimit(guid, ftype) {
       this.checkDailyReset();

       const estimatedCost = this.estimateCost(ftype);

       if (this.creditsUsedToday + estimatedCost > this.maxCreditsPerDay) {
         throw new Error(`Daily credit limit would be exceeded. Used: ${this.creditsUsedToday}, Limit: ${this.maxCreditsPerDay}`);
       }

       const result = await this.download(guid, ftype);
       this.creditsUsedToday += estimatedCost;

       return result;
     }

     checkDailyReset() {
       const today = new Date().toDateString();
       if (today !== this.lastResetDate) {
         this.creditsUsedToday = 0;
         this.lastResetDate = today;
       }
     }
   }
   ```

### **Purchasing Additional Credits**

**When Credits Run Low:**

* **Contact AccuZIP Sales:** 800.233.0555
* **Email Support:** api@accuzip.com
* **Account Portal:** Log in to manage subscription and purchase credit top-ups

**Pricing Tiers:**

* Contact AccuZIP for volume pricing and enterprise agreements
* Credits may be available in monthly subscription packages or one-time purchases
* Bulk discounts typically available for high-volume users

### **Credit Usage Reporting**

**Generate Monthly Credit Reports:**

```javascript
// Example: Monthly credit usage report
async function generateCreditReport(apiKey, month) {
  const accountInfo = await getAccountInfo(apiKey);

  const report = {
    reportMonth: month,
    openingBalance: accountInfo.credits_remaining.total + accountInfo.credits_used.total,
    creditsUsed: accountInfo.credits_used.total,
    creditsRemaining: accountInfo.credits_remaining.total,
    breakdown: {
      monthly: {
        used: accountInfo.credits_used.monthly,
        remaining: accountInfo.credits_remaining.monthly
      },
      annual: {
        used: accountInfo.credits_used.annual,
        remaining: accountInfo.credits_remaining.annual
      }
    },
    estimatedMonthlyBurnRate: accountInfo.credits_used.monthly,
    projectedRunoutDate: calculateRunoutDate(
      accountInfo.credits_remaining.total,
      accountInfo.credits_used.monthly
    )
  };

  return report;
}

function calculateRunoutDate(remaining, monthlyBurnRate) {
  if (monthlyBurnRate === 0) return 'N/A';

  const monthsRemaining = remaining / monthlyBurnRate;
  const runoutDate = new Date();
  runoutDate.setMonth(runoutDate.getMonth() + monthsRemaining);

  return runoutDate.toDateString();
}
```

## **16\. Testing and Development Support**

**Test Environment Access:**

* Test API keys available for integration validation  
* Contact api@accuzip.com for test credentials and sample data  
* Typically allows 2-3 free test jobs for new integrations  
* Keep a log of test Job GUID IDs to avoid billing confusion

**Integration Support:**

* API Support: api@accuzip.com
* Technical Support: 805.461.7300
* Sales Support: 800.233.0555

## **18. Field Mapping Reference: MLM ↔ AccuZIP**

This section documents how Mailing List Manager contact fields map to AccuZIP API parameters and responses.

### **18.1 Batch Upload: MLM Contacts → AccuZIP CSV**

When uploading a mailing list for batch validation, map MLM contact fields to AccuZIP required CSV columns:

| MLM Contact Field | AccuZIP CSV Column | Required | Format Notes |
|-------------------|-------------------|----------|--------------|
| `first_name` | `First` | ✅ Yes | Can contain full name if `last_name` empty |
| `last_name` | `Last` | Optional | Separate last name (recommended) |
| `middle_name` | `Middle` | Optional | Middle name or initial |
| `name_prefix` | `Sal` | Optional | Mr, Mrs, Dr, etc. |
| `company_name` | `Company` | Optional | Important for NCOA matching |
| `address_line1` | `Address` | ✅ Yes | Primary street address |
| `address_line2` | `Address2` | Optional | Apt, Suite, Unit, etc. |
| `city` | `City` | ✅ Yes | Can contain City+State+ZIP if split |
| `state` | `St` | Optional | 2-letter state code (recommended) |
| `postal_code` | `Zip` | Optional | ZIP or ZIP+4 (recommended) |
| `id` (UUID) | Custom column | Optional | For tracking; use `col_*` mapping params |

**CSV Generation Example:**
```javascript
// Example: Generate AccuZIP CSV from MLM contacts
function generateAccuZIPCSV(contacts) {
  const headers = ['First', 'Last', 'Address', 'Address2', 'City', 'St', 'Zip', 'Company'];
  const rows = contacts.map(contact => [
    contact.first_name || '',
    contact.last_name || '',
    contact.address_line1 || '',
    contact.address_line2 || '',
    contact.city || '',
    contact.state || '',
    contact.postal_code || '',
    contact.company_name || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}
```

### **18.2 Point-of-Entry API: MLM → AccuZIP Parameters**

For real-time single address validation, map MLM fields to Point-of-Entry API parameters:

| MLM Contact Field | AccuZIP API Parameter | Required | Example Value |
|-------------------|----------------------|----------|---------------|
| `address_line1` | `AZSetQuery_iadl1` | ✅ Yes | "1600 Amphitheatre Parkway" |
| `address_line2` | `AZSetQuery_iadl2` | No | "Suite 200" or "" |
| `address_line3` | `AZSetQuery_iadl3` | No | "" (rarely used) |
| `city` | `AZSetQuery_ictyi` | ✅ Yes | "Mountain View" |
| `state` | `AZSetQuery_istai` | ✅ Yes | "CA" |
| `postal_code` | `AZSetQuery_izipc` | ✅ Yes | "94043" |
| `id` (UUID) | `AZSetQuery_iforeignid` | No | "contact-uuid-1234" |
| `country` | `AZSetQuery_icountry` | No | "CA" for Canada, "US" or omit |

**Request Mapping Example:**
```typescript
// Example: Map MLM contact to AccuZIP Point-of-Entry request
interface MLMContact {
  id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

function mapToAccuZIPRequest(contact: MLMContact, apiKey: string) {
  return {
    API_KEY: apiKey,
    AZSetQuery_iadl1: contact.address_line1,
    AZSetQuery_iadl2: contact.address_line2 || '',
    AZSetQuery_iadl3: '',
    AZSetQuery_ictyi: contact.city,
    AZSetQuery_istai: contact.state,
    AZSetQuery_izipc: contact.postal_code,
    AZSetQuery_iforeignid: contact.id
  };
}
```

### **18.3 AccuZIP Response → MLM Database Fields**

Map AccuZIP validation response fields to MLM database storage:

| AccuZIP Response Field | MLM Database Field | Type | Notes |
|-----------------------|-------------------|------|-------|
| `validated_address.delivery_line_1` | `contacts.address_line1_validated` | varchar | CASS-standardized address |
| `validated_address.delivery_line_2` | `contacts.address_line2_validated` | varchar | Standardized secondary |
| `validated_address.city` | `contacts.city_validated` | varchar | USPS-standardized city |
| `validated_address.state` | `contacts.state_validated` | varchar(2) | 2-letter state code |
| `validated_address.zip` | `contacts.postal_code_validated` | varchar(5) | 5-digit ZIP |
| `validated_address.zip4` | `contacts.zip4` | varchar(4) | ZIP+4 extension |
| `validated_address.dpv_code` | `validation_jobs.results.dpv_code` | varchar | Y/D/S/N validation status |
| `validated_address.carrier_route` | `contacts.carrier_route` | varchar | USPS carrier route |
| `validated_address.delivery_point` | `contacts.delivery_point` | varchar(2) | Delivery point code |
| `validated_address.record_type` | `contacts.address_type` | varchar | S/P/H/R (Street/PO Box/Highrise/Rural) |

**DPV Code Interpretation:**
- `Y` = **Deliverable** - Both primary and secondary confirmed → `is_deliverable = true`
- `D` = **Primary Only** - Secondary missing → `is_deliverable = false`, `validation_warning = 'Missing apartment/suite'`
- `S` = **Secondary Unconfirmed** - Secondary present but not verified → `is_deliverable = false`, `validation_warning = 'Apartment/suite unconfirmed'`
- `N` = **Not Deliverable** - Address not confirmed → `is_deliverable = false`, `validation_error = 'Address not found'`

### **18.4 Batch GET QUOTE Response → MLM Statistics**

Map AccuZIP Data Quality results to MLM job statistics:

| AccuZIP DQ Field | MLM Field | Calculation | Display |
|-----------------|-----------|-------------|---------|
| `dq_dpvhsa_y` | `validation_jobs.deliverable_count` | Direct | "1,892 deliverable" |
| `dq_dpvhsa_d` | `validation_jobs.missing_secondary_count` | Direct | "11 missing apt/suite" |
| `dq_dpvhsa_s` | `validation_jobs.unconfirmed_secondary_count` | Direct | "70 unconfirmed apt/suite" |
| `dq_dpvhsa_n` | `validation_jobs.undeliverable_count` | Direct | "27 undeliverable" |
| `dq_dpvhsv` | `validation_jobs.vacant_count` | Direct | "31 vacant addresses" |
| N/A | `validation_jobs.total_problematic` | Sum: d+s+n+v | "139 addresses need review" |
| `total_records` | `validation_jobs.total_records` | Direct | "2,000 total records" |

**Statistics Display Example:**
```javascript
// Example: Calculate and display validation statistics
function calculateValidationStats(dqResults) {
  const deliverable = parseInt(dqResults.dq_dpvhsa_y);
  const missingSecondary = parseInt(dqResults.dq_dpvhsa_d);
  const unconfirmedSecondary = parseInt(dqResults.dq_dpvhsa_s);
  const undeliverable = parseInt(dqResults.dq_dpvhsa_n);
  const vacant = parseInt(dqResults.dq_dpvhsv);
  const total = parseInt(dqResults.total_records);

  return {
    deliverable,
    deliverablePercent: ((deliverable / total) * 100).toFixed(1),
    problematic: missingSecondary + unconfirmedSecondary + undeliverable + vacant,
    breakdown: {
      missingSecondary,
      unconfirmedSecondary,
      undeliverable,
      vacant
    },
    total
  };
}

// Display: "1,892 deliverable (94.6%) • 139 need review"
```

---

## **19. Response Transformation Examples**

This section demonstrates how to transform AccuZIP API responses into Mailing List Manager database records.

### **19.1 Point-of-Entry Validation Response → Database Update**

**AccuZIP Point-of-Entry Response:**
```json
{
  "success": true,
  "validated_address": {
    "delivery_line_1": "1600 AMPHITHEATRE PKWY",
    "delivery_line_2": "",
    "city": "MOUNTAIN VIEW",
    "state": "CA",
    "zip": "94043",
    "zip4": "1351",
    "dpv_code": "Y",
    "dpv_confirmation": "Y",
    "dpv_footnote": "AABB",
    "carrier_route": "C909",
    "delivery_point": "00",
    "check_digit": "6",
    "record_type": "S",
    "address_type": "FIRM"
  },
  "foreign_id": "contact-uuid-1234"
}
```

**Transform to MLM Database Update:**
```typescript
// TypeScript transformation function
interface AccuZIPValidationResponse {
  success: boolean;
  validated_address: {
    delivery_line_1: string;
    delivery_line_2: string;
    city: string;
    state: string;
    zip: string;
    zip4: string;
    dpv_code: 'Y' | 'D' | 'S' | 'N';
    carrier_route: string;
    delivery_point: string;
    record_type: string;
    address_type: string;
  };
  foreign_id: string;
}

function transformValidationResponse(
  response: AccuZIPValidationResponse
): Partial<MLMContact> {
  const { validated_address: va } = response;

  // Determine deliverability
  const isDeliverable = va.dpv_code === 'Y';

  // Generate warnings/errors
  let validationWarning: string | null = null;
  let validationError: string | null = null;

  switch (va.dpv_code) {
    case 'D':
      validationWarning = 'Apartment or suite number may be missing';
      break;
    case 'S':
      validationWarning = 'Apartment or suite number could not be verified';
      break;
    case 'N':
      validationError = 'Address could not be validated';
      break;
  }

  return {
    // Store validated/standardized address
    address_line1_validated: va.delivery_line_1,
    address_line2_validated: va.delivery_line_2 || null,
    city_validated: va.city,
    state_validated: va.state,
    postal_code_validated: va.zip,
    zip4: va.zip4,

    // Deliverability status
    is_deliverable: isDeliverable,
    validation_status: isDeliverable ? 'valid' : 'invalid',
    validation_warning: validationWarning,
    validation_error: validationError,

    // USPS metadata
    carrier_route: va.carrier_route,
    delivery_point: va.delivery_point,
    address_type: va.record_type, // S/P/H/R

    dpv_code: va.dpv_code,

    // Audit fields
    validated_at: new Date(),
    validation_provider: 'accuzip'
  };
}

// Usage in service
async function validateContact(contactId: string) {
  const contact = await db.contacts.findUnique({ where: { id: contactId } });

  const accuzipRequest = mapToAccuZIPRequest(contact, ACCUZIP_API_KEY);
  const accuzipResponse = await fetch(ACCUZIP_POINT_OF_ENTRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accuzipRequest)
  }).then(res => res.json());

  if (accuzipResponse.success) {
    const updateData = transformValidationResponse(accuzipResponse);

    await db.contacts.update({
      where: { id: contactId },
      data: updateData
    });

    return { success: true, isDeliverable: updateData.is_deliverable };
  }

  return { success: false, error: 'Validation failed' };
}
```

**Resulting Database Record:**
```sql
UPDATE contacts SET
  address_line1_validated = '1600 AMPHITHEATRE PKWY',
  address_line2_validated = NULL,
  city_validated = 'MOUNTAIN VIEW',
  state_validated = 'CA',
  postal_code_validated = '94043',
  zip4 = '1351',
  is_deliverable = true,
  validation_status = 'valid',
  validation_warning = NULL,
  validation_error = NULL,
  carrier_route = 'C909',
  delivery_point = '00',
  address_type = 'S',
  dpv_code = 'Y',
  validated_at = '2025-11-17 10:30:00',
  validation_provider = 'accuzip'
WHERE id = 'contact-uuid-1234';
```

### **19.2 Batch GET QUOTE Response → validation_jobs Table**

**AccuZIP GET QUOTE Response:**
```json
{
  "dq_dpvhsa_s": "70",
  "dq_dpvhsa_d": "11",
  "dq_dpvhsv": "31",
  "dq_dpvhsa_y": "1892",
  "dq_dpvhsa_n": "27",
  "dq_message": "DQ results have been calculated successfully",
  "success": true,
  "total_records": "2000"
}
```

**Transform to validation_jobs Record:**
```typescript
interface AccuZIPDQResults {
  dq_dpvhsa_y: string;  // Deliverable
  dq_dpvhsa_d: string;  // Missing secondary
  dq_dpvhsa_s: string;  // Unconfirmed secondary
  dq_dpvhsa_n: string;  // Undeliverable
  dq_dpvhsv: string;    // Vacant
  total_records: string;
  success: boolean;
}

function transformDQResults(
  jobId: string,
  dqResults: AccuZIPDQResults
) {
  const deliverable = parseInt(dqResults.dq_dpvhsa_y);
  const missingSecondary = parseInt(dqResults.dq_dpvhsa_d);
  const unconfirmedSecondary = parseInt(dqResults.dq_dpvhsa_s);
  const undeliverable = parseInt(dqResults.dq_dpvhsa_n);
  const vacant = parseInt(dqResults.dq_dpvhsv);
  const total = parseInt(dqResults.total_records);

  const problematic = missingSecondary + unconfirmedSecondary + undeliverable + vacant;

  return {
    id: jobId,
    status: 'completed',
    total_records: total,
    processed_records: total,
    deliverable_count: deliverable,
    undeliverable_count: problematic,
    results: {
      summary: {
        deliverable,
        deliverable_percent: ((deliverable / total) * 100).toFixed(1),
        problematic,
        problematic_percent: ((problematic / total) * 100).toFixed(1)
      },
      breakdown: {
        perfect: deliverable,
        missing_secondary: missingSecondary,
        unconfirmed_secondary: unconfirmedSecondary,
        not_found: undeliverable,
        vacant: vacant
      },
      raw_dq_results: dqResults
    },
    completed_at: new Date()
  };
}

// Usage
const jobUpdate = transformDQResults(validationJobId, accuzipDQResponse);
await db.validation_jobs.update({
  where: { id: validationJobId },
  data: jobUpdate
});
```

**Resulting validation_jobs Record:**
```json
{
  "id": "job-uuid-5678",
  "org_id": "org-uuid-1234",
  "status": "completed",
  "total_records": 2000,
  "processed_records": 2000,
  "deliverable_count": 1892,
  "undeliverable_count": 139,
  "results": {
    "summary": {
      "deliverable": 1892,
      "deliverable_percent": "94.6",
      "problematic": 139,
      "problematic_percent": "7.0"
    },
    "breakdown": {
      "perfect": 1892,
      "missing_secondary": 11,
      "unconfirmed_secondary": 70,
      "not_found": 27,
      "vacant": 31
    },
    "raw_dq_results": { }
  },
  "created_at": "2025-11-17T10:00:00Z",
  "completed_at": "2025-11-17T10:15:00Z"
}
```

### **19.3 Batch CSV Download → Bulk Contact Updates**

After downloading the validated CSV from AccuZIP, bulk update contacts:

```typescript
// Parse AccuZIP validated CSV and update contacts
async function processValidatedCSV(
  jobId: string,
  csvContent: string
) {
  const Papa = require('papaparse'); // CSV parser
  const { data: rows } = Papa.parse(csvContent, { header: true });

  // AccuZIP adds standardized fields to CSV
  const updates = rows.map(row => ({
    where: {
      // Match by original data (assuming you included ID in upload)
      email_hash: hashEmail(row.Email) // or use foreign_id
    },
    data: {
      address_line1_validated: row['Delivery Address'],
      address_line2_validated: row['Delivery Address 2'] || null,
      city_validated: row['City Name'],
      state_validated: row['State'],
      postal_code_validated: row['ZIP'],
      zip4: row['ZIP+4'] || null,
      carrier_route: row['Carrier Route'],
      delivery_point: row['Delivery Point'],
      dpv_code: row['DPV Code'],
      is_deliverable: row['DPV Code'] === 'Y',
      validated_at: new Date(),
      validation_job_id: jobId
    }
  }));

  // Bulk update using transaction
  await db.$transaction(
    updates.map(update =>
      db.contacts.update(update)
    )
  );

  return { updated: updates.length };
}
```

### **19.4 Error Response Handling**

**AccuZIP Error Response:**
```json
{
  "success": false,
  "message": "Invalid API_KEY provided"
}
```

**Transform to Validation Job Error:**
```typescript
function handleValidationError(
  jobId: string,
  errorResponse: { success: false; message: string }
) {
  return {
    id: jobId,
    status: 'failed',
    error: {
      message: errorResponse.message,
      timestamp: new Date(),
      provider: 'accuzip'
    },
    failed_at: new Date()
  };
}

// Store error in database
await db.validation_jobs.update({
  where: { id: jobId },
  data: handleValidationError(jobId, accuzipErrorResponse)
});
```

### **19.5 Real-Time UI Updates via WebSocket**

Transform AccuZIP webhook callback into WebSocket events:

```typescript
// Webhook handler
app.get('/accuzip-callback', async (req, res) => {
  const { guid } = req.query;

  // Fetch final results from AccuZIP
  const quoteResponse = await fetch(
    `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/${guid}/QUOTE`
  ).then(r => r.json());

  // Find associated job
  const job = await db.validation_jobs.findFirst({
    where: { provider_job_id: guid }
  });

  if (job && quoteResponse.success) {
    // Transform and update job
    const jobUpdate = transformDQResults(job.id, quoteResponse);
    await db.validation_jobs.update({
      where: { id: job.id },
      data: jobUpdate
    });

    // Emit WebSocket event to user
    io.to(`org:${job.org_id}`).emit('validation:complete', {
      jobId: job.id,
      summary: jobUpdate.results.summary,
      downloadUrl: `/api/validation/${job.id}/download`
    });
  }

  res.status(200).send('OK');
});
```

**Frontend WebSocket Handler:**
```typescript
// React component receiving validation updates
useEffect(() => {
  socket.on('validation:complete', (data) => {
    toast.success(
      `Validation complete: ${data.summary.deliverable} deliverable (${data.summary.deliverable_percent}%)`
    );

    // Update UI
    setValidationJob(prev => ({
      ...prev,
      status: 'completed',
      results: data.summary
    }));

    // Show download button
    setDownloadUrl(data.downloadUrl);
  });

  return () => socket.off('validation:complete');
}, []);
```

---

## **17\. Summary and Implementation Checklist**

**Pre-Implementation:**

* \[ \] Obtain AccuZIP API key and verify account access level
* \[ \] Set up webhook endpoint for processing completion notifications (Section 12)
* \[ \] Implement file format validation for customer uploads
* \[ \] Contact API support for test credentials and documentation links
* \[ \] Determine credit budget and set up monitoring (Section 15)
* \[ \] Decide between batch processing vs Point-of-Entry API for your use case (Section 5)

**Core Batch Processing Integration Steps:**

* \[ \] Implement file upload with proper field mapping and parameter ordering (Section 6.1)
* \[ \] Parse DQ results to calculate deliverable/undeliverable counts (Section 6.2)
* \[ \] Update order quantities based on deliverable address count
* \[ \] Configure mail piece parameters via Update Quote (Section 6.4)
* \[ \] Process list through appropriate CASS/NCOA/Presort pipeline (Section 6.5)
* \[ \] Download filtered CSV containing only deliverable records (Section 6.6)

**Real-Time Address Validation (For Web Forms):**

* \[ \] Integrate Point-of-Entry API for single address validation (Section 5)
* \[ \] Implement address typeahead/autocomplete component (Section 13)
* \[ \] Add Canadian address support if serving Canadian customers (Section 5)
* \[ \] Set up address validation caching to reduce API costs (Section 13)
* \[ \] Implement proper error handling and user feedback for validation failures

**Error Handling and Monitoring:**

* \[ \] Implement comprehensive error handling for all API calls (Section 14)
* \[ \] Set up credit usage monitoring and alerts (Section 15)
* \[ \] Configure credit balance thresholds (critical/warning/low)
* \[ \] Handle asynchronous processing with appropriate timeouts
* \[ \] Implement retry logic for failed requests
* \[ \] Test webhook callback functionality (Section 12)
* \[ \] Set up daily/monthly credit usage reporting (Section 15)

**Advanced Features (Optional):**

* \[ \] Implement data review endpoints for customer validation (Section 8)
* \[ \] Set up PostalOne integration for automated submission (Section 11)
* \[ \] Add EDDM support for saturation mailing campaigns (Section 9)
* \[ \] Implement individual processing steps for granular control (Section 7)
* \[ \] Enable extended 60-month NCOALink processing for compliance requirements (Section 7)
* \[ \] Integrate address typeahead for improved user experience (Section 13)
* \[ \] Implement rate limiting to prevent accidental credit exhaustion (Section 15)

**Production Readiness:**

* \[ \] Test all workflows in development environment
* \[ \] Verify credit consumption patterns match expectations
* \[ \] Implement monitoring and alerting for API failures
* \[ \] Document internal processes for handling validation failures
* \[ \] Train customer service team on address validation reports
* \[ \] Set up automated credit top-up alerts
* \[ \] Create runbooks for common error scenarios
* \[ \] Establish monthly credit budget review process

**Performance Optimization:**

* \[ \] Use preview downloads before committing to full file downloads (Section 15)
* \[ \] Implement address caching for Point-of-Entry API calls (Section 13)
* \[ \] Use `des_credits=true` strategically for cost monitoring (Section 15)
* \[ \] Batch operations efficiently to minimize per-job overhead
* \[ \] Configure appropriate debouncing for typeahead components (Section 13)

**Compliance and Best Practices:**

* \[ \] Ensure PAF (Processing Acknowledgment Form) is on file for NCOALink (Section 7)
* \[ \] Understand and document credit carry-over policies (Section 15)
* \[ \] Implement proper ARIA attributes for accessibility in typeahead (Section 13)
* \[ \] Follow USPS guidelines for CASS certification and postal discounts
* \[ \] Maintain audit logs of validation operations for compliance

**Key Integration Patterns by Use Case:**

**Use Case 1: E-commerce Checkout Address Validation**
* Implement Point-of-Entry API (Section 5)
* Add address typeahead component (Section 13)
* Cache validated addresses
* Provide real-time feedback to users

**Use Case 2: Bulk Mailing List Processing**
* Use batch file upload workflow (Section 6)
* Enable CASS + NCOA + Deduplication processing
* Download filtered deliverable-only CSV
* Generate USPS documentation for postage discounts

**Use Case 3: High-Compliance Financial Institution**
* Enable extended 60-month NCOALink processing (Section 7)
* Implement comprehensive error logging
* Set up credit usage monitoring with strict thresholds (Section 15)
* Maintain detailed audit trails

**Use Case 4: Marketing Platform with User-Generated Lists**
* Combine batch processing for large lists
* Point-of-Entry API for manual address entry
* Webhook integration for asynchronous processing (Section 12)
* Customer-facing validation reports

By following this comprehensive integration guide, your application can effectively leverage the AccuZIP API to:

* Validate customer mailing lists through batch processing or real-time validation
* Provide accurate deliverable/undeliverable counts with detailed DPV status
* Generate filtered CSV files containing only validated, deliverable addresses
* Enhance user experience with address typeahead/autocomplete functionality
* Manage credit consumption efficiently with monitoring and alerts
* Support both US and Canadian address validation
* Maintain compliance with postal regulations and industry standards
* Optimize costs through strategic API usage and caching


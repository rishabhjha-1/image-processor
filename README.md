# Documentation

### Role and Function of Each Component:

1. **Upload API**:
    - **Role**: Accepts the CSV file from the user.
    - **Function**: This API parses and validates the CSV file format (ensures correct columns and data). It stores the product and image information in the database, generates a unique request ID for the user, and returns it immediately.
2. **CSV Validation**:
    - **Role**: Ensures that the uploaded file is correctly formatted.
    - **Function**: Checks that all necessary columns (Serial Number, Product Name, Input Image URLs) are present and properly populated. If validation fails, the process is halted, and an error is returned.
3. **Database**:
    - **Role**: Stores product information, input/output image URLs, request ID, and processing status.
    - **Function**: The database holds two primary tables: one for storing product and image data and another to track each processing request's status. It gets updated asynchronously when images are processed and output URLs are generated.
4. **Asynchronous Worker**:
    - **Role**: Processes images in the background without blocking the system.
    - **Function**: It retrieves the input image URLs, compresses each image by 50%, and uploads the processed images to a storage service (e.g., AWS S3, Cloudinary). Afterward, it updates the database with the new output URLs.
5. **Webhook Service**:
    - **Role**: Notifies the user when processing is complete.
    - **Function**: This service triggers once all images for a particular request are processed. It calls a user-provided webhook URL with details about the completed task, such as the request ID, status, and output image URLs.
6. **Status API**:
    - **Role**: Allows users to check the status of their request.
    - **Function**: Users can query the system using their request ID to get information about the progress or completion of the image processing task. It fetches the status and processed URLs from the database.

### **Product Model Schema Design:**

```mathematica
mathematica
Copy code
┌──────────────────────────────┐
│         Product              │
├──────────────────────────────┤
│ Field Name       │ Data Type │
├──────────────────────────────┤
│ requestID        │ String    │  [Unique]
│ ─────────────────────────────
│ productName      │ String    │  [Required]
│ ─────────────────────────────
│ inputImageUrls   │ [String]  │  [Array of URLs] [Required]
│ ─────────────────────────────
│ outputImageUrls  │ [String]  │  [Array of URLs] [Optional] [Default: []]
│ ─────────────────────────────
│ status           │ String    │  [Enum: pending, in-progress, completed] [Default: pending]
│ ─────────────────────────────
│ webhookURL       │ String    │  [Optional]
│ ─────────────────────────────
│ createdAt        │ Date      │  [Default: Date.now]
│ ─────────────────────────────
│ updatedAt        │ Date      │  [Default: Date.now]
└──────────────────────────────┘

```

### **Explanation of Fields:**

1. **requestID**:
    - **Type**: `String`
    - **Purpose**: Unique identifier for each product processing request, used for tracking and querying status.
    - **Constraints**: Must be unique.
2. **productName**:
    - **Type**: `String`
    - **Purpose**: Name of the product associated with the input/output images.
    - **Constraints**: Required field.
3. **inputImageUrls**:
    - **Type**: Array of `String`
    - **Purpose**: Stores the list of URLs for the input images that need to be processed.
    - **Constraints**: Required field.
4. **outputImageUrls**:
    - **Type**: Array of `String`
    - **Purpose**: Stores the list of URLs for the processed images.
    - **Constraints**: Defaults to an empty array (`[]`). This will be populated when image processing is complete.
5. **status**:
    - **Type**: `String` (Enum)
    - **Purpose**: Tracks the current status of the image processing.
        - **Options**:
            - `pending`: Waiting for processing.
            - `in-progress`: Images are currently being processed.
            - `completed`: Processing is done, and output URLs are ready.
    - **Constraints**: Defaults to `pending`.
6. **webhookURL**:
    - **Type**: `String`
    - **Purpose**: Optional field for storing a webhook URL where a notification will be sent once image processing is completed.
7. **createdAt**:
    - **Type**: `Date`
    - **Purpose**: Timestamp for when the product record was created.
    - **Constraints**: Automatically defaults to the current date and time at the creation of the document.
8. **updatedAt**:
    - **Type**: `Date`
    - **Purpose**: Timestamp for when the product record was last updated.
    - **Constraints**: Automatically defaults to the current date and time. Could be updated when the status or output image URLs change

---

---

### **Use Cases:**

1. **Uploading a CSV**: When a CSV is uploaded, entries are created in the `Product` collection with the relevant product information and the `status` is set to `pending`.
2. **Processing the Images**: As the images are processed, the `outputImageUrls` are filled and the `status` is updated to `completed`.
3. **Webhook Notifications**: If a webhook URL is provided, the system will trigger a notification once the images are processed.

---

## **API Documentation: Image Processing System**

---

### **1. Upload API**

Uploads the CSV file, validates the format, and returns a unique request ID.

### **Endpoint:**

`POST /api/upload`

### **Description:**

- Accepts a CSV file containing product names and input image URLs.
- Validates the CSV format.
- Returns a unique `requestID` to track the image processing status.

### **Request:**

**Body:**

- **CSV File**: The file should contain the following columns:
    - `Serial Number`
    - `Product Name`
    - `Input Image URLs` (comma-separated list of image URLs)

**Example:**

```bash

POST /api/upload
Content-Type: multipart/form-data

file: products.csv

```

### **Response:**

**Status Code:** `200 OK`

**Body:**

```json

{
  "requestID": "12345",
  "message": "CSV file uploaded successfully. Processing started."
}

```

**Error Responses:**

- **Status Code:** `400 Bad Request` (if CSV validation fails)

```json

{
  "error": "Invalid CSV format"
}

```

- **Status Code:** `500 Internal Server Error` (if server error occurs)

---

### **2. Status API**

Checks the status of the image processing using the request ID.

### **Endpoint:**

`GET /api/status/:requestID`

### **Description:**

- Fetches the current status of the image processing request.
- Can be used to track whether the process is pending, in-progress, or completed.

### **Request:**

**URL Parameters:**

- `:requestID` - The unique identifier returned by the upload API.

**Example:**

```bash

GET /api/status/12345

```

### **Response:**

**Status Code:** `200 OK`

**Body:**

```json

{
  "requestID": "12345",
  "status": "in-progress",
  "productName": "SKU1",
  "inputImageUrls": [
    "https://www.public-image-url1.jpg",
    "https://www.public-image-url2.jpg"
  ],
  "outputImageUrls": [
    "https://www.public-image-output-url1.jpg",
    "https://www.public-image-output-url2.jpg"
  ]
}

```

**Error Responses:**

- **Status Code:** `404 Not Found` (if request ID is invalid or not found)

```json

{
  "error": "Request ID not found"
}

```

---

### **3. Webhook Notification**

Triggered when image processing is completed.

### **Endpoint:**

`POST /api/webhook`

### **Description:**

- This endpoint is triggered after all images have been processed.
- If the user has provided a webhook URL during CSV upload, this endpoint sends a POST request to the URL with the processing results.

### **Request (from your system to the user's webhook):**

**Headers:**

- `Content-Type: application/json`

**Body:**

```json

{
  "requestID": "12345",
  "status": "completed",
  "productName": "SKU1",
  "inputImageUrls": [
    "https://www.public-image-url1.jpg",
    "https://www.public-image-url2.jpg"
  ],
  "outputImageUrls": [
    "https://www.public-image-output-url1.jpg",
    "https://www.public-image-output-url2.jpg"
  ]
}

```

---

## Flow Chart

![Screenshot 2024-10-10 110501.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/d142e9c9-cec5-4b1f-96e3-747a839b0a87/84a548b5-c9ad-4002-946e-d391baafb669/Screenshot_2024-10-10_110501.png)

Link to flow chart—>https://drive.google.com/file/d/1qQTW7WA2aYrC-jtE474E3fnyXkUnL4BA/view?usp=sharing

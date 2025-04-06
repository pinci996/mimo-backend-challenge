# Mimo Backend Challenge Implementation

## Local Development

### Prerequisites

-   Node.js
-   npm

### Steps

1.  **Clone the Repository**

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Database Migrations:**
    This command creates the necessary tables in the SQLite database based on the TypeORM entities.
    ```bash
    npm run migration:run
    ```

4.  **Seed the Database:**
    This command populates the database with initial data (the hardcoded user, courses, chapters, lessons, and achievement definitions).
    ```bash
    npm run db:seed
    ```

5.  **Start the Development Server:**
    This command starts the server using `nodemon` for automatic restarts on file changes.
    ```bash
    npm run dev
    ```
    The server will be accessible at `http://localhost:3000`

## API Endpoints

The API uses JSON for both request input and response output.

### 1. Record Lesson Completion

Sends information about a lesson that the user completed.

-   **Method:** `POST`
-   **URL:** `/api/lessons/complete`
-   **Body (JSON Payload):**

    ```json
    {
      "userId": 1,
      "lessonId": "<lesson_id>", (Lessons 1-5 are swift courses, and will mark swift course as completed)
      "startedAt": "<iso_timestamp>",
      "completedAt": "<iso_timestamp>"
    }
    ```

    -   `userId` (Number): The ID of the user (currently hardcoded to `1`).
    -   `lessonId` (Number): The ID of the lesson that was completed.
    -   `startedAt` (String): Timestamp indicating when the lesson was started (e.g., `"2023-12-01T10:00:00.000Z"`).
    -   `completedAt` (String): Timestamp indicating when the lesson was completed (e.g., `"2023-12-01T10:05:30.000Z"`).

-   **Example Payload:**
    ```json
    {
      "userId": 1,
      "lessonId": 1,
      "startedAt": "2023-12-01T10:00:00.000Z",
      "completedAt": "2023-12-01T10:05:30.000Z"
    }
    ```

-   **Success Response (201 Created):**
    ```json
    {
        "message": "Lesson completion recorded successfully",
        "data": {
            "userId": 1,
            "lessonId": 1,
            "startedAt": "2023-12-01T10:00:00.000Z",
            "completedAt": "2023-12-01T10:05:30.000Z",
            "id": 1
        }
    }
    ```

### 2. Get User Achievements

Requests the status and progress of all achievements for a specific user.

-   **Method:** `GET`
-   **URL:** `/api/achievements/user/:userId`

-   **Example URL:**
    `http://localhost:3000/api/achievements/user/1`

-   **Success Response (200 OK):**
    ```json
    {
      "achievements": [
        {
          "id": "complete-5-lessons",
          "name": "Complete 5 Lessons",
          "isCompleted": false,
          "progress": 2,
          "threshold": 5
        },
        {
          "id": "complete-1-chapter",
          "name": "Complete 1 Chapter",
          "isCompleted": false,
          "progress": 0,
          "threshold": 1
        },
        ...
      ]
    }
    ```
    -   `id` (String): The unique identifier for the achievement.
    -   `name` (String): Name of the achievement.
    -   `isCompleted` (Boolean): Whether the user has completed this achievement.
    -   `progress` (Number): The user's current progress towards the achievement threshold.
    -   `threshold` (Number): The value needed to complete the achievement.

## Running with Docker

### Prerequisites

-   Docker Desktop (or Docker Engine + Docker Compose) installed and running.

### Steps

1.  **Build and Start the Container:**
    From the project root directory, run:
    ```bash
    docker-compose up --build -d
    ```

2.  **Initialize Database (Run Once):**
    The first time you start the container (or if you remove the `sqlite.db` volume), you need to run migrations and seeding *inside* the container. Open a separate terminal:
    ```bash
    # Run migrations
    docker-compose exec app npm run migration:run

    # Run seeding
    docker-compose exec app npm run db:seed
    ```
    
3.  **Access the Application:**
    The API will be available at `http://localhost:3000`.

4.  **Stop and Remove Containers:**
    ```bash
    docker-compose down
    ```

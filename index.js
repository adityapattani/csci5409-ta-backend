const express = require('express');
const app = express();
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: 'ASIAVRUVRQU2DPTSDYWN',
    secretAccessKey: 'BIvwRuCw8NQLr1VkNowUKq3JmO95njU+jQeZFRJ8',
    sessionToken: 'IQoJb3JpZ2luX2VjEIL//////////wEaCXVzLXdlc3QtMiJIMEYCIQDS5lV9HPIc1cZOJ7P5FPfWybRZIfItoiu/9GzYVKj+1wIhANCtnvXOsu7JXoDRKMrHdBGPZAvyM61z/fQvSW6xV0IuKrICCKv//////////wEQABoMMzgxNDkxOTcxMzgwIgwFkd/Ztrb6PMUIqfYqhgKaJkEC/Heterbj04aJPlDMbNmY6Bmf79PxWpmLHEpdfwDO5TszDeUNeRSNI7OeOEj+TbBmzuF9CYZmUDi/v6DLOVGoCopI0Ym5uoCnEwE0MY1rSQt3nmopowFciG0/Fs90kYCf6u9lSSIGy+0BfNCharGrSXiaUGNuCkV7MzvC0GxPnAdWobd3oLlZllv5+9ROlTK4VK1dWr2E4UEYzMVWz8TAN1dcqp3nUvKm0FPL+0lODgwDimPBkvQqYsUzE6p4c6EDDSbu2FxGbD871WzBwNuv2+qkKAPefkR7KfFDVMcbcttKHfi20LUiybEkB488o3gCjVC/O+E+ziwM4NtvhOi8ousfMPntwLAGOpwBYtL4yUGN83+ypqUIg5kad1892AhGLIWGMPk85ke9OAn6415B1B/z8TYr4TT7BBYhLTOJLrLzL1oONbwpVwfv//nR0Ft/GJficjqvJRnTWKcwry7ZDjcz7ZnxsGhiF+xQrCbfc2JsqmTnhCYTODlS9kIAfl4bZ0xAGmaqA2LjvQxIMn9AJ7eumufCU5qnGj9GxiUGYbk1c6V56IA/'
});

// Create Athena instance
const athena = new AWS.Athena();

// Define API routes
app.get('/query', async (req, res) => {
    const query = req.query.query;

    // Construct the query parameters
    const params = {
        QueryString: query,
        ResultConfiguration: {
            OutputLocation: 's3://csci5409-bucket/query_results/'
        }
    };

    try {
        // Execute the query
        const data = await athena.startQueryExecution(params).promise();
        const queryExecutionId = data.QueryExecutionId;

        // Wait for the query to complete
        await waitForQueryCompletion(queryExecutionId);

        // Get query results
        const results = await getQueryResults(queryExecutionId);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Function to wait for query completion
async function waitForQueryCompletion(queryExecutionId) {
    const params = {
        QueryExecutionId: queryExecutionId
    };

    let status = '';

    do {
        const data = await athena.getQueryExecution(params).promise();
        status = data.QueryExecution.Status.State;
        
        if (status === 'FAILED' || status === 'CANCELLED') {
            throw new Error('Query execution failed or was cancelled');
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
    } while (status !== 'SUCCEEDED');
}

// Function to get query results
async function getQueryResults(queryExecutionId) {
    const params = {
        QueryExecutionId: queryExecutionId
    };

    const data = await athena.getQueryResults(params).promise();
    return formatData(data);
}

function formatData(data) {
    const rows = data.ResultSet.Rows.slice(2); // Exclude the first two rows which contain column names and empty values

    const transformedData = rows.map(row => {
        const id = row.Data[0].VarCharValue;
        const name = row.Data[1].VarCharValue;
        return { id, name };
    });

    const output = {
        data: transformedData
    };

    return output;
}

// Start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

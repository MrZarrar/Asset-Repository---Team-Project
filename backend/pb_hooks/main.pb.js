/**
 * @fileoverview Main PocketBase hooks configuration file.
 * @module pb_hooks/main
 */

/**
 * Creates a route that responds with a greeting message.
 * 
 * @function
 * @param {Object} e - The event object containing request and response information.
 * @param {Object} e.request - The request object.
 * @param {Function} e.request.pathValue - Function to extract path parameters.
 * @param {Function} e.json - Function to send a JSON response.
 * @returns {Object} JSON response containing a greeting message.
 */
routerAdd("GET", "/hello/{name}", (e) => {
    let name = e.request.pathValue("name")

    return e.json(200, { "message": "Hello " + name })
})

/**
 * Hook that runs after a user record is successfully updated.
 * Logs the updated user's email address.
 * 
 * @function
 * @param {Object} e - The event object containing record information.
 * @param {Object} e.record - The updated record.
 * @param {Function} e.record.get - Function to get values from the record.
 * @param {Function} e.next - Function to continue the execution flow.
 */
onRecordAfterUpdateSuccess((e) => {
    console.log("user updated...", e.record.get("email"))

    e.next()
}, "users")
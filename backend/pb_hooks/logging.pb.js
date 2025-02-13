import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function logActions(action, file, user, time) {
    $app.logger().info(
    action + " was done on file: " + file,
    "user", user,
    "time", time
    )
}
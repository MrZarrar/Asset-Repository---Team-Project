import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090'); 
const collectionName = 'assets';

export async function createRecord(data) {
    try {
        const record = await pb.collection(collectionName).create(data);
        logActions("added", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return record;
    } catch (error) {
        console.error('Error when creating record:', error);
    }
}

export async function fetchRecordById(id) {
    try {
        const record = await pb.collection(collectionName).getOne(id);
        logActions("viewed", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return record;
    } catch (error) {
        console.error('Error when fetching record:', error);
    }
}

export async function updateRecord(id, data) {
    try {
        const updatedRecord = await pb.collection(collectionName).update(id, data);
        logActions("edited", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return updatedRecord;
    } catch (error) {
        console.error('Error when updating record:', error);
    }
}

export async function deleteRecord(id) {
    try {
        await pb.collection(collectionName).delete(id);
        logActions("deleted", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
    } catch (error) {
        console.error('Error when deleting record:', error);
    }
}
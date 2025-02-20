import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090'); 
const collectionName = 'assets';

export async function createRecord(data) {
    try {
        const record = await pb.collection(collectionName).create(data);
        console.log('Record created:', record);
        return record;
    } catch (error) {
        console.error('Error when creating record:', error);
    }
}

export async function fetchRecordById(id) {
    try {
        const record = await pb.collection(collectionName).getOne(id);
        console.log('Record retrieved:', record);
        return record;
    } catch (error) {
        console.error('Error when fetching record:', error);
    }
}

export async function updateRecord(id, data) {
    try {
        const updatedRecord = await pb.collection(collectionName).update(id, data);
        console.log('Record updated:', updatedRecord);
        return updatedRecord;
    } catch (error) {
        console.error('Error when updating record:', error);
    }
}

export async function deleteRecord(id) {
    try {
        await pb.collection(collectionName).delete(id);
        console.log('Record deleted:', id);
    } catch (error) {
        console.error('Error when deleting record:', error);
    }
}

export async function fetchAllRecords() {
    try {
        const records = await pb.collection(collectionName).getFullList();
        console.log('Record(s) fetched:', records);
        return records;
    } catch (error) {
        console.error('Error fetching record(s):', error);
    }
}
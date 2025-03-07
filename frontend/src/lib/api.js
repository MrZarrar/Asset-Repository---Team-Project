export const updateProfile = async (userid, name, username, email) => {
    const url = `http://127.0.0.1:8090/api/collections/profiles/records/${userid}`;

    const data = {
        name: name,
        username: username,
        email: email,
        profilePicture: profilePicture
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`An error has occurred: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw new Error('An error has occurred while updating the user');
    }
};


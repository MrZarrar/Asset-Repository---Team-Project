export const updateProfile = async (userid, name, username, email) => {
    const url = ''; // Add the actual API endpoint URL here

    const data = {
        name: name,
        username: username,
        email: email
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


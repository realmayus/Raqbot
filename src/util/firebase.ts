import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

class Firebase {

    /**
     * Database instance
     */
    private database: admin.database.Database;

    constructor(cert: any, dbUrl: string, private functionsUrl: string) {


        admin.initializeApp({
            credential: admin.credential.cert(cert),
            databaseURL: dbUrl
        });

        this.database = admin.database();
    }

    /**
     * Retrieve the global statistics
     * @return {Promise<any>} - A promise resolving to the global statistics
     */
    fetchGlobalStats(): Promise<any> {
        const globalRef = this.database.ref('global');
        return new Promise((resolve, reject) => {
            globalRef.on('value',
                (data) => {
                    if (data) {
                        resolve(data.val());
                    } else {
                        reject('snapshot is null')
                    }
                },
                (error: any) => {
                    reject(error);
                });
        });
    }

    updateData(refName: string, data: any) {
        const ref = this.database.ref(refName);
        ref.update(data);
    }

    setData(refName: string, data: any) {
        const ref = this.database.ref(refName);
        ref.set(data);
    }

    incrementNumber(refName: string, value: number) {
        const ref = this.database.ref(refName);
        ref.transaction((current_value) => {
            return (current_value || 0) + value;
        });
    }

    updateWordCount(id: string, word: string) {
        const wordRef = this.database.ref(`wordCount/${id}/word`);
        const scoreRef = this.database.ref(`wordCount/${id}/score`);

        wordRef.set(word);

        scoreRef.transaction((current_value) => {
            return (current_value || 0) + 1;
        });
    }

    async getRating(message: string): Promise<number> {
        const fetchOptions = {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: 'message=' + message,
        };

        let jsonResponse;

        try {
            const res = await fetch(this.functionsUrl + '/rating', fetchOptions);
            jsonResponse = await res.json();
        } catch (e) {
            console.log(e);
            throw new Error('Rating error: Could not connect to function');
        }

        if(jsonResponse.rating) {
            return jsonResponse.rating;
        } else {
            throw new Error('Rating error: function did not return rating');
        }
    }
}

export = Firebase;

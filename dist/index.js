"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
// import mongoose from 'mongoose';
const main = async () => {
    const plutonio = new client_1.PlutonioClient();
    console.log('INSERT');
    const response_insert = await plutonio.user.insert({
        username: 'unique2',
        first_name: 'A'
    });
    console.log(response_insert);
    // console.log('UPDATE');
    // const response_update = await plutonio.user.update('644e5097d65b9dd38c7b29c4', {
    //   username: 'unique3',
    //   first_name: 'AA',
    //   last_name: 'w'
    // });
    // console.log(response_update);
    console.log('DELETE');
    const response_delete = await plutonio.user.delete(response_insert._id);
    console.log(response_delete);
    console.log('SELECT');
    const users = await plutonio.user.select({});
    console.log(users);
    console.log('COUNT');
    const count = await plutonio.user.count({});
    console.log(count);
    await plutonio.disconnect();
};
main();
//# sourceMappingURL=index.js.map
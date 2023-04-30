"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
// import mongoose from 'mongoose';
const main = async () => {
    const plutonio = new client_1.PlutonioClient();
    // const response = await plutonio.user.insert({
    //   username: 'unique',
    //   first_name: 'F'
    // });
    // console.log(response);
    // const response = await plutonio.user.delete('644d2e006713c9e294e76785' as any);
    // console.log(response);
    const users = await plutonio.user.select({});
    console.log(users);
    await plutonio.disconnect();
};
main();
//# sourceMappingURL=index.js.map
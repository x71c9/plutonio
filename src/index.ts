import {PlutonioClient} from './client';

// import mongoose from 'mongoose';

const main = async () => {
  const plutonio = new PlutonioClient();
  const user = await plutonio.user.select({
    // username: 'uniquename',
    // first_name: 'first'
  });
  console.log(user);

  await plutonio.disconnect();

  // const connection = mongoose.createConnection(process.env.DATABASE_URL || '');
  // const atom_schema_def = {
  //   id: {
  //     type: undefined,
  //     required: is_required,
  //   }
  // };
  // let atom_mongo_schema = new mongoose.Schema(atom_schema_def, {
  //   versionKey: false,
  //   strict: false
  // });
  // const model = connection.model(atom_mongo_schema);
};

main();

import {PlutonioClient} from './client';

// import mongoose from 'mongoose';

const main = async () => {
  const plutonio = new PlutonioClient();

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

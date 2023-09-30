import plutonio from '../src/index';

it(`should do something`, () => {
  const project_schema = plutonio.generate();
  console.log(project_schema);
});

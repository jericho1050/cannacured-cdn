import { FlakeId } from "@nerimity/flakeid";

// initiate flake
const flake = new FlakeId({
  mid: 42 + parseInt(process.env.cpu || "0"),
  timeOffset: (2013 - 1970) * 31536000 * 1000,
});

export const generateId = () => {
  return flake.gen().toString();
};

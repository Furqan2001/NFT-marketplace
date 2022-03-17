module.exports = {
  images: {
    domains: ["ipfs.infura.io"],
    loader: (width, src, quality) =>
      `/preprocessed-images/${filename}-${width}.jpg`
  },
  reactStrictMode: true
};

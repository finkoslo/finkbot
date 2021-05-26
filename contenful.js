const contentful = require('contentful');

const client = contentful.createClient({
	space: process.env.CONTENTFUL_SPACE_ID,
	accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

fetchContent = async contentType => {
	let result;
	await client
		.getEntries({ content_type: contentType })
		.then(response => (result = response.items))
		.catch(error => console.error(error));
	return result;
};

module.exports = {
	fetchContent
};
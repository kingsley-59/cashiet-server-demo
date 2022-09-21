const axios = require('axios')
require('dotenv').config()


const getAuthorizationToken = async (req, res, next) => {
    try {
        const { data } = await axios.post(
            process.env.INDICINA_AUTH_TOKEN_URL,
            {
                "client_id": process.env.INDICINA_CLIENT_ID,
                "client_secret": process.env.INDICINA_CLIENT_SECRET
            }
        ) ?? {}
        if (data?.status === 'success') {
            req.indicina_token = data?.data.token
            next()
        } else {
            res.status(500).json({mesage: 'Unable to get authorization token'})
            return ;
        }
    } catch (error) {
        // console.log(error.message)
        res.status(500).send({message: error.message})
    }
}

module.exports = getAuthorizationToken
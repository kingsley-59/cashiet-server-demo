const mongoose = require('mongoose')

const IndicinaSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,

        customer: {
            id: {
				type: String | null
			},

			firstname: {
				type: String | null
			},

			lastname: {
				type: String | null
			},

			email: {
				type: String | null
			}
        },

        decision_data: {
            type: Object,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Indicina', IndicinaSchema)
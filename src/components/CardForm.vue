<template>
  <form v-on:submit.prevent="submitForm" class="cardForm">
    <div class="status-message error" v-show="errorMsg !== ''">{{errorMsg}}</div>
    <div class="form-group">
      <label for="title">Title:</label>
      <input id="title" type="text" class="form-control" v-model="card.title" autocomplete="off" />
    </div>
    <div class="form-group">
      <label for="tag">Tag:</label>
      <select id="tag" class="form-control" v-model="card.tag">
        <option value="Feature Request">Feature Request</option>
        <option value="Design">Design</option>
        <option value="Q&A">Q&A</option>
      </select>
      <label for="status">Status:</label>
      <select id="tag" class="form-control" v-model="card.status">
        <option value="Planned">Planned</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
    </div>
    <div class="form-group">
      <label for="description">Description:</label>
      <textarea id="description" class="form-control" v-model="card.description"></textarea>
    </div>
    <button class="btn btn-submit">Submit</button>
    <button class="btn btn-cancel" v-on:click.prevent="cancelForm" type="cancel">Cancel</button>
  </form>
</template>

<script>
import moment from "moment";
import { mapActions, mapGetters } from 'vuex'; // Import mapActions and mapGetters

export default {
  name: "card-form",
  props: {
    cardID: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      card: {
        title: "",
        description: "",
        status: "Planned",
        tag: "",
        date: null
      },
      errorMsg: ""
    };
  },
  methods: {
    ...mapActions(['addNewCard', 'updateExistingCard', 'fetchCardDetail']), // Map actions

    async submitForm() {
      const cardData = {
        boardId: Number(this.$route.params.boardID),
        title: this.card.title,
        description: this.card.description,
        status: this.card.status,
        tag: this.card.tag,
      };

      if (this.cardID === 0) {
        // Add new card
        cardData.date = moment().format("MMM Do YYYY");
        try {
          const response = await this.addNewCard(cardData);
          if (response.status === 201) {
            this.$router.push(`/board/${cardData.boardId}`);
          }
        } catch (error) {
          this.handleErrorResponse(error, "adding");
        }
      } else {
        // Update existing card
        cardData.id = this.cardID;
        cardData.date = this.card.date; // Preserve original date for updates
        try {
          const response = await this.updateExistingCard(cardData);
          if (response.status === 200) {
            this.$router.push(`/board/${cardData.boardId}`);
          }
        } catch (error) {
          this.handleErrorResponse(error, "updating");
        }
      }
    },
    cancelForm() {
      this.$router.push(`/board/${this.$route.params.boardID}`);
    },
    handleErrorResponse(error, verb) {
      if (error.response) {
        this.errorMsg = `Error ${verb} card. Response received was '${error.response.statusText}'.`;
      } else if (error.request) {
        this.errorMsg = `Error ${verb} card. Server could not be reached.`;
      } else {
        this.errorMsg = `Error ${verb} card. Request could not be created.`;
      }
      console.error(error);
    }
  },
  async created() {
    if (this.cardID !== 0) {
      try {
        // Fetch card detail into the store
        await this.fetchCardDetail(this.cardID);
        // Populate local card data from the store's currentCard
        this.card = { ...this.currentCard }; // Use spread to create a copy, not a reference
      } catch (error) {
        if (error.response && error.response.status === 404) {
          alert("Card not available. This card may have been deleted or you have entered an invalid card ID.");
          this.$router.push("/");
        } else {
            this.handleErrorResponse(error, "retrieving");
        }
      }
    }
  },
  computed: {
      ...mapGetters(['currentCard']) // Get the current card from the store
  },
  // If you need to react to currentCard changing after initial load (e.g., if another component updates it)
  watch: {
    currentCard: {
      handler(newCard) {
        // Update local card data if the store's currentCard changes, but only if it's not empty
        if (newCard && Object.keys(newCard).length > 0 && this.cardID !== 0) {
            this.card = { ...newCard };
        }
      },
      deep: true, // Watch for nested changes
      immediate: true // Run handler immediately with the current value
    }
  }
};
</script>

<style>
/* Styles remain the same */
.cardForm {
  padding: 10px;
  margin-bottom: 10px;
}
.form-group {
  margin-bottom: 10px;
  margin-top: 10px;
}
label {
  display: inline-block;
  margin-bottom: 0.5rem;
}
.form-control {
  display: block;
  width: 80%;
  height: 30px;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}
textarea.form-control {
  height: 75px;
  font-family: Arial, Helvetica, sans-serif;
}
select.form-control {
  width: 20%;
  display: inline-block;
  margin: 10px 20px 10px 10px;
}
.btn-submit {
  color: #fff;
  background-color: #0062cc;
  border-color: #005cbf;
}
.btn-cancel {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}
.status-message {
  display: block;
  border-radius: 5px;
  font-weight: bold;
  font-size: 1rem;
  text-align: center;
  padding: 10px;
  margin-bottom: 10px;
}
.status-message.success {
  background-color: #90ee90;
}
.status-message.error {
  background-color: #f08080;
}
</style>
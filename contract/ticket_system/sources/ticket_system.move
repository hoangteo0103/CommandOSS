/*
/// Module: ticket_system
module ticket_system::ticket_system;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module ticket_system::ticket_system {
    /// Ticket struct representing a ticket for an event
    public struct Ticket has key, store {
        id: UID,
        event_id: u64,
        ticket_type: u8,
        owner: address,
        used: bool
    }
 
    /// Error codes
    const E_TICKET_ALREADY_USED: u64 = 1;

    /// Creates a new ticket for an event
    public entry fun mint_ticket(
        event_id: u64, 
        ticket_type: u8, 
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let ticket = Ticket {
            id: object::new(ctx),
            event_id,
            ticket_type,
            owner: sender,
            used: false
        };

        transfer::transfer(ticket, sender);
    }

    /// Marks a ticket as used
    public entry fun use_ticket(
        ticket: &mut Ticket,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(ticket.owner == sender, 0);
        assert!(!ticket.used, E_TICKET_ALREADY_USED);
        
        ticket.used = true;
    }

    /// Getter for ticket information
    public fun get_ticket_info(ticket: &Ticket): (u64, u8, address, bool) {
        (ticket.event_id, ticket.ticket_type, ticket.owner, ticket.used)
    }
}



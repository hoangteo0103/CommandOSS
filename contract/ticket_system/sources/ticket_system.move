/*
/// Module: ticket_system
module ticket_system::ticket_system;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module ticket_system::ticket_system {

    // === Structs ===
    
    /// Ticket struct representing a ticket for an event
    /// Note: Cannot add `drop` ability because UID doesn't have drop
    public struct Ticket has key, store {
        id: UID,
        event_id: u64,
        ticket_type: u8,
        owner: address,
        used: bool
    }
 
    // === Error Constants ===
    const E_TICKET_ALREADY_USED: u64 = 1;
    const E_NOT_TICKET_OWNER: u64 = 2;
    const E_INVALID_EVENT_ID: u64 = 3;
    const E_INVALID_TICKET_TYPE: u64 = 4;

    // === Public Entry Functions ===

    /// Creates a new ticket for an event
    /// Fixed: Accept recipient parameter to mint directly to user wallets
    public entry fun mint_ticket(
        event_id: u64, 
        ticket_type: u8,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(event_id > 0, E_INVALID_EVENT_ID);
        assert!(ticket_type < 255, E_INVALID_TICKET_TYPE); // u8 max value check
        
        let ticket = Ticket {
            id: object::new(ctx),
            event_id,
            ticket_type,
            owner: recipient,  // Set the intended recipient as owner
            used: false
        };

        transfer::public_transfer(ticket, recipient);  // Transfer to recipient
    }

    public entry fun use_ticket(
        ticket: &mut Ticket,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(ticket.owner == sender, E_NOT_TICKET_OWNER);
        assert!(!ticket.used, E_TICKET_ALREADY_USED);
        
        ticket.used = true;
    }

    /// Transfer ticket to another address (new feature)
    public entry fun transfer_ticket(
        mut ticket: Ticket,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(ticket.owner == sender, E_NOT_TICKET_OWNER);
        assert!(!ticket.used, E_TICKET_ALREADY_USED);
        
        ticket.owner = new_owner;
        transfer::public_transfer(ticket, new_owner);
    }

    public entry fun get_ticket_info_entry(
        ticket: &Ticket,
        _ctx: &mut TxContext
    ) {
        // This function exists purely to expose ticket data to off-chain callers
        // The actual data reading happens through sui::object inspection
        // This is a workaround since Sui doesn't support view functions yet
        
        // The data can be accessed by calling this function and inspecting
        // the transaction effects or by using client.getObject() directly
    }

    /// Traditional getter for on-chain use (kept for compatibility)
    public fun get_ticket_info(ticket: &Ticket): (u64, u8, address, bool) {
        (ticket.event_id, ticket.ticket_type, ticket.owner, ticket.used)
    }

    // === Public Accessor Functions for Better Integration ===
    
    /// Get event ID
    public fun event_id(ticket: &Ticket): u64 {
        ticket.event_id
    }
    
    /// Get ticket type
    public fun ticket_type(ticket: &Ticket): u8 {
        ticket.ticket_type
    }
    
    /// Get owner
    public fun owner(ticket: &Ticket): address {
        ticket.owner
    }
    
    /// Check if ticket is used
    public fun is_used(ticket: &Ticket): bool {
        ticket.used
    }

    /// Get ticket ID
    public fun id(ticket: &Ticket): &UID {
        &ticket.id
    }

    // === Utility Functions ===
    
    /// Check if ticket belongs to a specific event
    public fun is_for_event(ticket: &Ticket, event_id: u64): bool {
        ticket.event_id == event_id
    }
    
    /// Check if ticket is of specific type
    public fun is_ticket_type(ticket: &Ticket, ticket_type: u8): bool {
        ticket.ticket_type == ticket_type
    }
    
    /// Validate ticket ownership
    public fun is_owner(ticket: &Ticket, address: address): bool {
        ticket.owner == address
    }
}



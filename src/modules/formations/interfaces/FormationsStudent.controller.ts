import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { FluxDEvenements } from '../../../common/interfaces/http/flux-d-evenements.decorator';
import { resolveClientIpOrUnknown } from '../../../common/interfaces/security/client-ip.util';
import {
  ProtegeContreLesRobots,
  RoutePublique,
} from '../../../common/interfaces/security/formulaire-public.decorator';
import { JoinSessionUseCase } from '../application/JoinSession.useCase';
import { LireSujetUseCase } from '../application/LireSujet.useCase';
import { RecordIncidentsUseCase } from '../application/RecordIncidents.useCase';
import { SaveFreeResponseUseCase } from '../application/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../application/SubmitAnswer.useCase';
import { SubmitProductionUseCase } from '../application/SubmitProduction.useCase';
import { EvaluerFeuilleUseCase } from '../application/EvaluerFeuille.useCase';
import { EvaluerTableauUseCase } from '../application/EvaluerTableau.useCase';
import { EvaluerMachineUseCase } from '../application/EvaluerMachine.useCase';
import { TelechargerPieceJointeUseCase } from '../application/TelechargerPieceJointe.useCase';
import { TenterEnigmeUseCase } from '../application/TenterEnigme.useCase';
import type { ClasseurTelecharge } from '../domain/IClasseursDeCours.port';
import { DeclarerJalonUseCase } from '../application/DeclarerJalon.useCase';
import { DefisUseCase } from '../application/Defis.useCase';
import { LireEtatParticipantUseCase } from '../application/LireEtatParticipant.useCase';
import { LireRappelsUseCase } from '../application/LireRappels.useCase';
import type { CoursPublic } from '../domain/contrats/tirage';
import {
  InvalidSessionCodeError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import { CodeScanProtectionService } from './CodeScanProtection.service';
import { IdentiteDuJeton, RouteParticipant } from './ParticipantToken.guard';
import { JoinSessionRequestDto } from './dto/join-session.request.dto';
import { JoinSessionResponseDto } from './dto/join-session.response.dto';
import { FreeResponseSavedResponseDto } from './dto/free-responses.response.dto';
import { ReportIncidentsRequestDto } from './dto/report-incidents.request.dto';
import { SaveFreeResponseRequestDto } from './dto/save-free-response.request.dto';
import { SubmitAnswerRequestDto } from './dto/submit-answer.request.dto';
import { SubmitAnswerResponseDto } from './dto/submit-answer.response.dto';
import { DeclarerJalonRequestDto } from './dto/contrat/declarer-jalon.request.dto';
import { EtatParticipantResponseDto } from './dto/contrat/etat-participant.response.dto';
import { RappelsResponseDto } from './dto/contrat/rappels.response.dto';
import { StrategiesDefiResponseDto } from './dto/contrat/strategies-defi.response.dto';
import { SubmitDefiRequestDto } from './dto/contrat/submit-defi.request.dto';
import { SubmitProductionRequestDto } from './dto/contrat/submit-production.request.dto';
import { EvaluerFeuilleRequestDto } from './dto/contrat/evaluer-feuille.request.dto';
import { FeuilleEvalueeResponseDto } from './dto/contrat/feuille-evaluee.response.dto';
import { EvaluerTableauRequestDto } from './dto/contrat/evaluer-tableau.request.dto';
import { TableauEvalueResponseDto } from './dto/contrat/tableau-evalue.response.dto';
import { EvaluerMachineRequestDto } from './dto/contrat/evaluer-machine.request.dto';
import { MachineEvalueeResponseDto } from './dto/contrat/machine-evaluee.response.dto';
import { TentativeEnigmeResponseDto } from './dto/contrat/tentative-enigme.response.dto';
import { TenterEnigmeRequestDto } from './dto/contrat/tenter-enigme.request.dto';
import { SubmitProductionResponseDto } from './dto/contrat/verdict-production.response.dto';
import { SujetResponseDto } from './dto/contrat/sujet.response.dto';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_FLUX_PAR_PARTICIPANT,
  LIMITE_ETAT_PAR_PARTICIPANT,
  LIMITE_EVALUATIONS_PAR_PARTICIPANT,
  LIMITE_INCIDENTS_PAR_PARTICIPANT,
  LIMITE_JALONS_PAR_PARTICIPANT,
  LIMITE_JOIN_PAR_CODE,
  LIMITE_PIECES_JOINTES_PAR_PARTICIPANT,
  LIMITE_RAPPELS_PAR_PARTICIPANT,
  LIMITE_REPONSES_PAR_PARTICIPANT,
  LIMITE_SUJET_PAR_PARTICIPANT,
  LIMITE_TENTATIVES_PAR_PARTICIPANT,
  LimiteParParticipant,
  suivreParCodeDeSession,
} from './formations-throttling';
import {
  type IdentiteSignee,
  ParticipantTokenService,
} from './ParticipantToken.service';
import { TelechargementDePieceJointe } from './piece-jointe-telechargee';

function EvaluationEnSeance(
  chemin: string,
  resume: string,
  reponse: new () => unknown,
): MethodDecorator {
  return applyDecorators(
    LimiteParParticipant(LIMITE_EVALUATIONS_PAR_PARTICIPANT),
    Post(chemin),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: resume }),
    ApiOkResponse({ type: reponse }),
    ApiBadRequestResponse({
      description:
        'Evaluation refusee, cause dans le champ code du corps : TYPE_DE_QUESTION ou PRODUCTION_INVALIDE',
    }),
    ApiNotFoundResponse({
      description:
        'Evaluation refusee, cause dans le champ code du corps : ECRAN_NON_SERVI ou PARTICIPANT_INTROUVABLE',
    }),
    ApiConflictResponse({
      description:
        'Evaluation refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE ou SEANCE_TERMINEE',
    }),
    RouteParticipant(),
  );
}

@ApiTags('formations')
@RoutePublique()
@Controller('formations')
export class FormationsStudentController {
  constructor(
    private readonly joinSession: JoinSessionUseCase,
    private readonly submitAnswer: SubmitAnswerUseCase,
    private readonly submitProduction: SubmitProductionUseCase,
    private readonly evaluerFeuille: EvaluerFeuilleUseCase,
    private readonly evaluerTableau: EvaluerTableauUseCase,
    private readonly evaluerMachine: EvaluerMachineUseCase,
    private readonly tenterEnigme: TenterEnigmeUseCase,
    private readonly declarerJalon: DeclarerJalonUseCase,
    private readonly defis: DefisUseCase,
    private readonly lireEtatParticipant: LireEtatParticipantUseCase,
    private readonly lireRappels: LireRappelsUseCase,
    private readonly recordIncidents: RecordIncidentsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly lireSujet: LireSujetUseCase,
    private readonly telechargerPieceJointe: TelechargerPieceJointeUseCase,
    private readonly saveFreeResponse: SaveFreeResponseUseCase,
    private readonly tokens: ParticipantTokenService,
    private readonly codeScan: CodeScanProtectionService,
  ) {}

  @Throttle({
    default: {
      limit: LIMITE_JOIN_PAR_CODE,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParCodeDeSession,
    },
  })
  @Post('sessions/:code/join')
  @ProtegeContreLesRobots()
  @ApiOperation({ summary: 'Rejoint une session avec le code dicte en classe' })
  @ApiCreatedResponse({ type: JoinSessionResponseDto })
  @ApiBadRequestResponse({
    description: 'Code de session invalide, ou email refuse',
  })
  @ApiTooManyRequestsResponse({ description: 'Balayage de codes detecte' })
  async join(
    @Param('code') code: string,
    @Body() dto: JoinSessionRequestDto,
    @Req() request: Request,
  ): Promise<JoinSessionResponseDto> {
    const adresse = resolveClientIpOrUnknown(request);
    this.codeScan.assertPasDeBalayage(adresse);
    const result = await this.joinSession
      .execute({
        code,
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        secretDeReprise: dto.secretDeReprise,
      })
      .catch((error: unknown) => {
        if (estCodeSansSeance(error)) {
          this.codeScan.enregistrerEchec(adresse);
        }
        throw error;
      });
    return {
      participantId: result.participantId,
      sessionId: result.sessionId,
      ecranCourant: result.ecranCourant,
      modeRythme: result.modeRythme,
      jeton: this.tokens.sign(
        result.sessionId,
        result.participantId,
        result.generationDeJeton,
      ),
      secretDeReprise: result.secretDeReprise,
    };
  }

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
  @Post('sessions/:id/answers')
  @ApiOperation({ summary: 'Soumet une reponse, corrigee cote serveur' })
  @ApiCreatedResponse({ type: SubmitAnswerResponseDto })
  @ApiConflictResponse({
    description:
      'Reponse refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE, PHASE_FERMEE, REPONSE_DEJA_ENREGISTREE ou COURS_MODIFIE',
  })
  @ApiNotFoundResponse({
    description:
      'Ecran non encore projete par le formateur : code ECRAN_NON_SERVI',
  })
  @RouteParticipant()
  async answer(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: SubmitAnswerRequestDto,
  ): Promise<SubmitAnswerResponseDto> {
    const verdict = await this.submitAnswer.execute({
      sessionId,
      participantId,
      questionId: dto.questionId,
      valeur: dto.valeur,
      dureeMs: dto.dureeMs,
    });
    return {
      correcte: verdict.correcte,
      misconception: verdict.misconception,
      libelleConfusion: verdict.libelleConfusion,
    };
  }

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
  @Post('sessions/:id/free-responses')
  @ApiOperation({
    summary:
      'Enregistre la reponse libre du participant, la derniere envoyee remplace la precedente',
  })
  @ApiCreatedResponse({ type: FreeResponseSavedResponseDto })
  @ApiBadRequestResponse({
    description:
      'Reponse vide une fois les blancs retires, ou activite inconnue de l ecran : code ACTIVITE_INCONNUE',
  })
  @ApiNotFoundResponse({
    description:
      'Seance ou cours introuvable, ou ecran non encore projete : code ECRAN_NON_SERVI',
  })
  @ApiConflictResponse({
    description:
      'Reponse refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE ou SEANCE_TERMINEE',
  })
  @RouteParticipant()
  async freeResponse(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: SaveFreeResponseRequestDto,
  ): Promise<FreeResponseSavedResponseDto> {
    await this.saveFreeResponse.execute({
      sessionId,
      participantId,
      screenId: dto.screenId,
      activityId: dto.activityId,
      response: dto.response,
      dureeMs: dto.dureeMs,
    });
    return { status: 'enregistre' };
  }

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
  @Post('sessions/:id/productions')
  @ApiOperation({
    summary: 'Soumet une production, corrigee et notee cote serveur',
  })
  @ApiCreatedResponse({ type: SubmitProductionResponseDto })
  @ApiBadRequestResponse({
    description:
      'Production refusee, cause dans le champ code du corps : TYPE_DE_QUESTION, PRODUCTION_VIDE ou PRODUCTION_INVALIDE',
  })
  @ApiNotFoundResponse({
    description:
      'Production refusee, cause dans le champ code du corps : ECRAN_NON_SERVI',
  })
  @ApiConflictResponse({
    description:
      'Production refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE, REPONSE_DEJA_ENREGISTREE ou REPRISES_EPUISEES',
  })
  @RouteParticipant()
  async production(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: SubmitProductionRequestDto,
  ): Promise<SubmitProductionResponseDto> {
    return this.submitProduction.execute({
      sessionId,
      participantId,
      questionId: dto.questionId,
      valeur: dto.valeur,
      dureeMs: dto.dureeMs,
    });
  }

  @EvaluationEnSeance(
    'sessions/:id/feuilles/:planId/evaluation',
    'Calcule la feuille de l eleve a la validation d une cellule, sans rien enregistrer',
    FeuilleEvalueeResponseDto,
  )
  async evaluationDeFeuille(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('planId') planId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: EvaluerFeuilleRequestDto,
  ): Promise<FeuilleEvalueeResponseDto> {
    return this.evaluerFeuille.execute({
      sessionId,
      participantId,
      planId,
      cellules: dto.cellules,
      recopie: dto.recopie,
    });
  }

  @EvaluationEnSeance(
    'sessions/:id/tableaux/:planId/evaluation',
    'Calcule le tableau de l eleve a la validation d une cellule, sans rien enregistrer',
    TableauEvalueResponseDto,
  )
  async evaluationDeTableau(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('planId') planId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: EvaluerTableauRequestDto,
  ): Promise<TableauEvalueResponseDto> {
    return this.evaluerTableau.execute({
      sessionId,
      participantId,
      planId,
      saisies: dto.saisies,
    });
  }

  @EvaluationEnSeance(
    'sessions/:id/machines/:ecranId/evaluation',
    'Calcule la machine de l eleve au relachement d un curseur, sans rien enregistrer',
    MachineEvalueeResponseDto,
  )
  async evaluationDeMachine(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('ecranId') ecranId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: EvaluerMachineRequestDto,
  ): Promise<MachineEvalueeResponseDto> {
    return this.evaluerMachine.execute({
      sessionId,
      participantId,
      ecranId,
      reglages: dto.reglages,
    });
  }

  @LimiteParParticipant(LIMITE_TENTATIVES_PAR_PARTICIPANT)
  @Post('sessions/:id/escape/:parcoursId/tentatives')
  @ApiOperation({
    summary: 'Tente une enigme, corrigee et plafonnee cote serveur',
  })
  @ApiCreatedResponse({ type: TentativeEnigmeResponseDto })
  @ApiNotFoundResponse({
    description:
      'Enigme absente du parcours, ou ecran non encore projete : code ECRAN_NON_SERVI',
  })
  @ApiConflictResponse({
    description:
      'Tentative refusee, cause dans le champ code du corps : ENIGME_VERROUILLEE, ENIGME_DEJA_RESOLUE ou TENTATIVES_EPUISEES',
  })
  @RouteParticipant()
  async tentativeEnigme(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('parcoursId') parcoursId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: TenterEnigmeRequestDto,
  ): Promise<TentativeEnigmeResponseDto> {
    return this.tenterEnigme.execute({
      sessionId,
      participantId,
      parcoursId,
      enigmeId: dto.enigmeId,
      reponse: dto.reponse,
      dureeMs: dto.dureeMs,
    });
  }

  @LimiteParParticipant(LIMITE_JALONS_PAR_PARTICIPANT)
  @Put('sessions/:id/pulses/:sondageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Declare l etat du jalon de confiance, anonymise par HMAC',
  })
  @ApiNoContentResponse({ description: 'Jalon enregistre' })
  @ApiBadRequestResponse({ description: 'Sondage inconnu du cours' })
  @ApiNotFoundResponse({
    description:
      'Jalon refuse, cause dans le champ code du corps : ECRAN_NON_SERVI',
  })
  @ApiConflictResponse({
    description:
      'Jalon refuse, cause dans le champ code du corps : SEANCE_NON_DEMARREE ou SEANCE_TERMINEE',
  })
  @RouteParticipant()
  async jalon(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('sondageId') sondageId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: DeclarerJalonRequestDto,
  ): Promise<void> {
    await this.declarerJalon.execute({
      sessionId,
      participantId,
      sondageId,
      etat: dto.etat,
    });
  }

  @LimiteParParticipant(LIMITE_TENTATIVES_PAR_PARTICIPANT)
  @Post('sessions/:id/defis/:defiId/tentative')
  @ApiOperation({
    summary:
      'Envoie la tentative du defi et rend les strategies de reference, sans leur justesse',
  })
  @ApiCreatedResponse({ type: StrategiesDefiResponseDto })
  @ApiNotFoundResponse({
    description:
      'Defi absent du cours, ou ecran non encore projete : code ECRAN_NON_SERVI',
  })
  @ApiBadRequestResponse({ description: 'Tentative vide' })
  @RouteParticipant()
  async tentativeDeDefi(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('defiId') defiId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: SubmitDefiRequestDto,
  ): Promise<StrategiesDefiResponseDto> {
    return this.defis.tenter({
      sessionId,
      participantId,
      defiId,
      texte: dto.texte,
      dureeMs: dto.dureeMs,
    });
  }

  @LimiteParParticipant(LIMITE_JALONS_PAR_PARTICIPANT)
  @Get('sessions/:id/defis/:defiId/strategies')
  @ApiOperation({
    summary:
      'Resert les strategies du defi, avec leur justesse une fois le defi revele ou la seance terminee',
  })
  @ApiOkResponse({ type: StrategiesDefiResponseDto })
  @ApiNotFoundResponse({
    description:
      'Defi inconnu, aucune tentative envoyee, ou ecran non encore projete : code ECRAN_NON_SERVI',
  })
  @RouteParticipant()
  async strategiesDuDefi(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('defiId') defiId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
  ): Promise<StrategiesDefiResponseDto> {
    return this.defis.strategies(sessionId, participantId, defiId);
  }

  @LimiteParParticipant(LIMITE_ETAT_PAR_PARTICIPANT)
  @Get('sessions/:id/moi')
  @ApiOperation({
    summary:
      'Rend l etat du seul participant porte par le jeton, pour reprendre apres un rechargement',
  })
  @ApiOkResponse({ type: EtatParticipantResponseDto })
  @RouteParticipant()
  async monEtat(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
  ): Promise<EtatParticipantResponseDto> {
    return this.lireEtatParticipant.execute({
      sessionId,
      participantId,
    }) as Promise<EtatParticipantResponseDto>;
  }

  @LimiteParParticipant(LIMITE_RAPPELS_PAR_PARTICIPANT)
  @Get('sessions/:id/rappels')
  @ApiOperation({
    summary:
      'Sert la liste figee des rappels espaces du participant, options melangees par sa graine',
  })
  @ApiOkResponse({ type: RappelsResponseDto })
  @ApiNotFoundResponse({
    description:
      'Cours sans ecran de rappel espace, ou ecran non encore projete : code ECRAN_NON_SERVI',
  })
  @RouteParticipant()
  async rappels(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
  ): Promise<RappelsResponseDto> {
    return this.lireRappels.execute({
      sessionId,
      participantId,
    }) as Promise<RappelsResponseDto>;
  }

  @LimiteParParticipant(LIMITE_INCIDENTS_PAR_PARTICIPANT)
  @Post('sessions/:id/incidents')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remonte le journal d incidents du poste etudiant' })
  @ApiNoContentResponse({ description: 'Incidents enregistres' })
  @RouteParticipant()
  @ApiConflictResponse({
    description: 'SEANCE_TERMINEE : la seance est close',
  })
  async incidents(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
    @Body() dto: ReportIncidentsRequestDto,
  ): Promise<void> {
    await this.recordIncidents.execute(
      sessionId,
      participantId,
      dto.incidents.map((incident) => ({
        sessionId,
        participantId,
        type: incident.type,
        contexte: incident.contexte ?? null,
        horodatage: incident.horodatage,
      })),
    );
  }

  @LimiteParParticipant(LIMITE_SUJET_PAR_PARTICIPANT)
  @Get('sessions/:id/sujet')
  @ApiOperation({
    summary: 'Sert au participant le sujet de son propre tirage',
  })
  @ApiOkResponse({
    type: SujetResponseDto,
    description: 'Sujet du tirage du participant, sans corrige',
  })
  @ApiConflictResponse({
    description: 'Le cours a change depuis l ouverture de la seance',
  })
  @RouteParticipant()
  async sujet(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
  ): Promise<CoursPublic> {
    return this.lireSujet.execute({ sessionId, participantId });
  }

  @LimiteParParticipant(LIMITE_PIECES_JOINTES_PAR_PARTICIPANT)
  @Get('sessions/:id/pieces-jointes/:ecranId')
  @TelechargementDePieceJointe(
    'Sert au participant le classeur réservé d un écran déjà projeté',
  )
  @RouteParticipant()
  @ApiNotFoundResponse({
    description:
      'Écran pas encore projeté au poste, ou dont l’écran corrigé reste caché (ECRAN_NON_SERVI) ; écran sans classeur réservé (PIECE_JOINTE_INTROUVABLE)',
  })
  @ApiConflictResponse({
    description:
      'Classeur portant les réponses d’une activité dont la correction n’est pas encore révélée (PIECE_JOINTE_RETENUE)',
  })
  @ApiTooManyRequestsResponse({
    description: 'Plus de vingt téléchargements par minute depuis ce poste',
  })
  pieceJointe(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('ecranId') ecranId: string,
    @IdentiteDuJeton() { participantId }: IdentiteSignee,
  ): Promise<ClasseurTelecharge> {
    return this.telechargerPieceJointe.pourLeParticipant(
      { sessionId, participantId },
      ecranId,
    );
  }

  @LimiteParParticipant(LIMITE_FLUX_PAR_PARTICIPANT)
  @FluxDEvenements(
    'sessions/:id/stream',
    'Etat de la seance a chaque changement, vu du participant',
  )
  @ApiOperation({ summary: 'Flux temps reel de l etat de la session' })
  @RouteParticipant()
  @ApiTooManyRequestsResponse({
    description:
      'Seance pleine (cent flux etudiants) ou trop d ouvertures par minute ; au-dela de deux flux, le plus ancien du participant est ferme',
  })
  stream(
    @Param('id', ParseUUIDPipe) id: string,
    @IdentiteDuJeton() identite: IdentiteSignee,
  ): Observable<MessageEvent> {
    return this.streamSession.execute(
      id,
      identite.participantId,
      identite.generation,
    );
  }
}

function estCodeSansSeance(error: unknown): boolean {
  return (
    error instanceof SessionNotFoundError ||
    error instanceof InvalidSessionCodeError
  );
}
